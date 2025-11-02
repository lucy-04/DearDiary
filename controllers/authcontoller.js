const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client = require("../config/db");

const {getCurrentTimestamp} = require("../utils/timeStampHelper");

exports.register = async (req,res,next) => {
    const {username,password,email} = req.body;

    try{
        const userExsits = await client.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email,username]
        );

        if(userExsits.rows.length > 0){
            return res.status(400).json({
                success: false,
                message: 'User already exsits'
            });
        }

        const salt = await bycrypt.genSalt(10);
        const hashPassword = await bycrypt.hash(password,salt);
        const now = getCurrentTimestamp();

        const newUser = await client.query(
            'INSERT INTO users (username,email,password_hash,created_at,updated_at) VALUES ($1,$2,$3,$4,$5) RETURNING id,username,email,password_hash,created_at,updated_at',
            [username,email,hashPassword,now,now]
        )

        const token = jwt.sign(
            {userId : newUser.rows[0].id,email: newUser.rows[0].email},
            process.env.JWT_SECRET,
            { expiresIn : process.env.JWT_EXPIRES_IN || '7d'}
        );
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user : {
                id : newUser.rows[0].id,
                username : newUser.rows[0].username,
                email : newUser.rows[0].email 
            }
        });

    }
    catch(error){
        next(error);
    }
};

exports.login = async (req, res, next) => {
    console.log('logging attemot with email')
    const {email,password} = req.body;

    try{
        const user = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )
        console.log("the data is ",user);

    // ADD THIS CHECK - Verify user exists
    if (!user || !user.rows || user.rows.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const userData = user.rows[0];
    console.log('✅ User found:', userData.email);

        const isMatch = await bycrypt.compare(password, user.rows[0].password_hash);

         if(!isMatch){
            return res.send(401).json({
                success: false,
                message: 'invalid credentials'
            });
        }

        const token = jwt.sign(
        { userId: user.rows[0].id, email: user.rows[0].email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user.rows[0].id,
            username: user.rows[0].username,
            email: user.rows[0].email
        }
        });
    } 
  catch (error) {
    next(error);
    }
};