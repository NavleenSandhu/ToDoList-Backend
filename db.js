const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})

async function getTasksByUserId(userId) {
    const [rows] = await connection.query('SELECT * FROM Tasks WHERE USER_ID=?', [userId]);
    return rows;
}

async function getTaskByTaskId(taskId) {
    const [rows] = await connection.query('SELECT * FROM Tasks WHERE TASK_ID=?', [taskId]);
    return rows[0];
}

async function addTask(taskDescription, dueDate, userId) {
    await connection.query("INSERT INTO Tasks (TASK_DESCRIPTION, DUE_DATE, USER_ID) VALUES(?,?,?)", [taskDescription, dueDate, userId])
}

async function addUser(email, fname, lname, password) {
    await connection.query("INSERT INTO Users (EMAIL, FIRST_NAME, LAST_NAME, PASSWORD) VALUES (?, ?, ?, ?)"
        , [email, fname, lname, password])

}

async function getUserByEmail(email) {
    const [users] = await connection.query('SELECT * FROM USERS WHERE email=?', email);
    return users[0]
}

async function updateTaskByTaskId(taskDescription, dueDate, taskId) {
    await connection.query("UPDATE Tasks SET TASK_DESCRIPTION=?, DUE_DATE=? WHERE TASK_ID=?", [taskDescription, dueDate, taskId])
}

async function deleteTaskByTaskId(taskId) {
    await connection.query("DELETE FROM TASKS WHERE TASK_ID=?", [taskId])
}

module.exports = { getTasksByUserId, addTask, addUser, updateTaskByTaskId, deleteTaskByTaskId, getUserByEmail, getTaskByTaskId }