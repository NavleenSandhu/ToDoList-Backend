const express = require('express')
const bcrypt = require('bcryptjs')
const { getTasksByUserId, addTask, addUser, updateTaskByTaskId, deleteTaskByTaskId, getUserByEmail, getTaskByTaskId } = require('./db.js')
const fetchuser = require('./fetchuser.js');
const jwt = require('jsonwebtoken')
const port = 5000;
const JWT_SECRET = 'navleensandhu11'
const cors = require("cors");

const corsOptions = {
    origin: "http://localhost:3000",
};

const app = express();
app.use(cors(corsOptions));

function isValidPassword(password) {
    // for checking if password length is between 8 and 15
    if (password.length < 8) {
        return false;
    }
    // to check space
    if (password.indexOf(" ") !== -1) {
        return false;
    }
    // for digits from 0 to 9
    let count = 0;
    for (let i = 0; i <= 9; i++) {
        if (password.indexOf(i) !== -1) {
            count = 1;
        }
    }
    if (count === 0) {
        return false;
    }
    // for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return false;
    }
    // for capital letters
    count = 0;
    for (let i = 65; i <= 90; i++) {
        if (password.indexOf(String.fromCharCode(i)) !== -1) {
            count = 1;
        }
    }
    if (count === 0) {
        return false;
    }
    // for small letters
    count = 0;
    for (let i = 97; i <= 122; i++) {
        if (password.indexOf(String.fromCharCode(i)) !== -1) {
            count = 1;
        }
    }
    if (count === 0) {
        return false;
    }
    // if all conditions fail
    return true;
}

app.listen(port, () => {
    console.log(`Server live on port ${port}`)
});

app.use(express.json());

app.post('/register', async (req, res) => {
    try {
        //if body does not have the required fields send error
        let response = {}
        let status;
        const { email, fname, lname, password } = req.body;
        let emailExists = !(email === undefined || email === null)
        let fNameExists = !(fname === undefined || fname === null)
        let passwordExists = !(password === undefined || password === null)
        if (!isValidPassword(password)) {
            response = { failure: "Invalid Password- Password should be at least 8 characters, should contain at least a digit, a lowercase and an uppercase letter and a special character" }
            status = 400;
        }
        else if (emailExists && fNameExists && passwordExists && isValidPassword(password)) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            await addUser(email, fname, lname, passwordHash);
            const user = await getUserByEmail(email)
            const data = {
                user: { id: user.USER_ID, fname: user.FIRST_NAME, lname: user.LAST_NAME }
            }
            const token = jwt.sign(data, JWT_SECRET);
            response = { success: "User added", token: token }
            status = 200
        }
        else {
            response = { failure: "Inputs missing" }
            status = 400
        }
        res.status(status).json(response)
    } catch (error) {
        let errorResponse;
        let status;
        if (error.code == "ER_DUP_ENTRY") {
            errorResponse = { failure: "Duplicate entry" }
            status = 400
        } else {
            errorResponse = { Error: error.message }
        }
        res.status(status).json(errorResponse)
    }
})

app.post('/login', async (req, res) => {
    try {
        //if body does not have the required fields send error
        let response = {}
        let status;
        const { email, password } = req.body;
        let emailExists = !(email === undefined || email === null)
        let passwordExists = !(password === undefined || password === null)
        if (emailExists && passwordExists) {
            const user = await getUserByEmail(email)
            if (user === undefined || user === null) {
                response = { failure: "Invalid credentials" }
                status = 400
            }
            else {
                const passwordCompare = await bcrypt.compare(password, user.PASSWORD)

                if (passwordCompare) {
                    const data = {
                        user: { id: user.USER_ID, fname: user.FIRST_NAME, lname: user.LAST_NAME }
                    }
                    const token = jwt.sign(data, JWT_SECRET);
                    response = { success: "User found", token: token }
                    status = 200
                } else {
                    response = { failure: "Invalid credentials" }
                    status = 400
                }
            }
        } else {
            response = { failure: "Please enter the credentials" }
            status = 400
        }
        res.status(status).json(response)
    } catch (error) {
        res.status(500).json({ Error: error.message })
    }
})

app.get('/tasks', fetchuser, async (req, res) => {
    try {
        res.status(200).json(await getTasksByUserId(req.user.id))
    } catch (error) {
        res.status(500).json({ Error: error.message })
    }
})

app.post('/tasks', fetchuser, async (req, res) => {
    try {
        //if body does not have the required fields send error
        let response = {}
        let status;
        const { taskDescription, dueDate } = req.body;
        let taskDescriptionExists = !(taskDescription === undefined || taskDescription === null);
        let dueDateExists = !(dueDate === undefined || dueDate === null);
        let validDate = !(new Date(dueDate) == "Invalid Date")
        if (taskDescriptionExists && dueDateExists && validDate) {
            await addTask(taskDescription, dueDate, req.user.id)
            response = { success: "Task added" }
            status = 200
        }
        else if (!validDate) {
            response = { failure: "Not a valid date" }
            status = 400
        }
        else if (taskDescriptionExists && !dueDateExists) {
            response = { failure: "Due date missing" }
            status = 400
        }
        else if (dueDateExists && !taskDescriptionExists) {
            response = { failure: "Task Description missing" }
            status = 400
        }
        else {
            response = { failure: "Task Description and Due date missing" }
            status = 400
        }
        res.status(status).json(response)
    } catch (error) {
        res.status(500).json({ Error: error.message })
    }
})
app.put('/tasks/:id', fetchuser, async (req, res) => {
    try {
        //if id is not a number send error
        let response = {}
        let status;
        let dueDate = req.body.dueDate;
        if (isNaN(parseInt(req.params.id))) {
            response = { failure: 'Please enter a valid url' }
            status = 400
        }
        else {
            if (new Date(dueDate) == "Invalid Date" || new Date(dueDate).getFullYear() > 9999) {
                response = { failure: "Not a valid date" }
                status = 400
            } else {
                const task = await getTaskByTaskId(req.params.id)
                if (req.user.id == await task.USER_ID) {
                    await updateTaskByTaskId(req.body.taskDescription ? req.body.taskDescription : task.TASK_DESCRIPTION, req.body.dueDate ? req.body.dueDate : task.DUE_DATE, req.params.id)
                    response = { success: "Task updated" }
                    status = 200
                }
                else {
                    response = { forbidden: "Not Authorized" }
                    status = 403
                }
            }
        }
        res.status(status).json(response)

    } catch (error) {
        console.log(error)
        res.status(500).json({ Error: error.message })
    }
})
app.delete('/tasks/:id', fetchuser, async (req, res) => {
    try {
        //if id is not a number send error
        let response = {}
        let status;
        if (isNaN(parseInt(req.params.id))) {
            response = { failure: 'Please enter a valid url' }
            status = 400
        }
        else {
            const task = await getTaskByTaskId(req.params.id)
            if (req.user.id == await task.USER_ID) {
                await deleteTaskByTaskId(req.params.id)
                response = { success: "Task deleted" }
                status = 200
            } else {
                response = { forbidden: "Not Authorized" }
                status = 403
            }
        }
        res.status(status).json(response)

    } catch (error) {
        res.status(500).json({ Error: error.message })
    }
})

app.get('/name', fetchuser, async (req, res) => {
    try {
        const { fname, lname } = req.user
        let response = { fname, lname }
        let status = 200
        res.status(status).json(response)
    } catch (error) {
        res.status(500).json({ Error: error.message })
    }
})