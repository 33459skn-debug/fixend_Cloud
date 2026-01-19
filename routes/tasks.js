const express = require('express');
const { prepare } = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/tasks - Get all tasks for the logged-in user
router.get('/', (req, res) => {
    try {
        const tasks = prepare(`
      SELECT 
        id,
        text,
        completed,
        priority,
        deadline_day,
        deadline_month,
        deadline_year,
        formatted_deadline,
        view,
        created_at as date
      FROM tasks 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

        // Transform to match frontend format
        const formattedTasks = tasks.map(task => ({
            id: task.id,
            text: task.text,
            completed: task.completed === 1,
            priority: task.priority,
            deadline: {
                day: task.deadline_day || '',
                month: task.deadline_month || '',
                year: task.deadline_year || ''
            },
            formattedDeadline: task.formatted_deadline,
            view: task.view,
            date: task.date
        }));

        res.json({ tasks: formattedTasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks - Create a new task
router.post('/', (req, res) => {
    try {
        const { text, priority, deadline, formattedDeadline, view } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Task text is required' });
        }

        const result = prepare(`
      INSERT INTO tasks (user_id, text, priority, deadline_day, deadline_month, deadline_year, formatted_deadline, view)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            req.user.id,
            text.trim(),
            priority || 'none',
            deadline?.day || null,
            deadline?.month || null,
            deadline?.year || null,
            formattedDeadline || null,
            view || 'inbox'
        );

        // Get the created task
        const task = prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Task created successfully',
            task: {
                id: task.id,
                text: task.text,
                completed: task.completed === 1,
                priority: task.priority,
                deadline: {
                    day: task.deadline_day || '',
                    month: task.deadline_month || '',
                    year: task.deadline_year || ''
                },
                formattedDeadline: task.formatted_deadline,
                view: task.view,
                date: task.created_at
            }
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { text, completed, priority, deadline, formattedDeadline, view } = req.body;

        // Check if task exists and belongs to user
        const existingTask = prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(parseInt(id), req.user.id);
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update task
        prepare(`
      UPDATE tasks 
      SET text = ?, completed = ?, priority = ?, deadline_day = ?, deadline_month = ?, deadline_year = ?, formatted_deadline = ?, view = ?
      WHERE id = ? AND user_id = ?
    `).run(
            text !== undefined ? text : existingTask.text,
            completed !== undefined ? (completed ? 1 : 0) : existingTask.completed,
            priority !== undefined ? priority : existingTask.priority,
            deadline?.day !== undefined ? deadline.day : existingTask.deadline_day,
            deadline?.month !== undefined ? deadline.month : existingTask.deadline_month,
            deadline?.year !== undefined ? deadline.year : existingTask.deadline_year,
            formattedDeadline !== undefined ? formattedDeadline : existingTask.formatted_deadline,
            view !== undefined ? view : existingTask.view,
            parseInt(id),
            req.user.id
        );

        // Get updated task
        const task = prepare('SELECT * FROM tasks WHERE id = ?').get(parseInt(id));

        res.json({
            message: 'Task updated successfully',
            task: {
                id: task.id,
                text: task.text,
                completed: task.completed === 1,
                priority: task.priority,
                deadline: {
                    day: task.deadline_day || '',
                    month: task.deadline_month || '',
                    year: task.deadline_year || ''
                },
                formattedDeadline: task.formatted_deadline,
                view: task.view,
                date: task.created_at
            }
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Check if task exists and belongs to user
        const existingTask = prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(parseInt(id), req.user.id);
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Delete task
        prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(parseInt(id), req.user.id);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
