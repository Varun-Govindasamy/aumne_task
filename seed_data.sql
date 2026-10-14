INSERT INTO sessions (title, goal, scheduled_duration, start_time, end_time, status)
VALUES
    ('Write project proposal', 'Draft the goals and milestones', 50, '2026-10-14 08:00:00', '2026-10-14 08:48:00', 'completed'),
    ('Review research notes', 'Summarize the key findings', 40, '2026-10-14 09:00:00', NULL, 'scheduled'),
    ('Prepare presentation', 'Build the first five slides', 30, '2026-10-14 07:00:00', '2026-10-14 07:45:00', 'overdue');

INSERT INTO interruptions (session_id, reason, pause_time, resume_time)
VALUES (1, 'Quick stretch break', '2026-10-14 08:20:00', '2026-10-14 08:23:00');
