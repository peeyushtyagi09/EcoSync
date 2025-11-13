const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { 
        type: String,
         required: true,
          unique: true,
           index: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username must be at most 30 characters'],
            match: [/^[a-zA-Z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, and hyphens only'],
             trim: true
            },
    email: { 
        type: String,
         required: [ true, 'Email is required'],
          unique: true,
          lowercase: true,
           index: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(v);
                },
                message: props => `${props.value} is not a valid email`
              },
        },
    passwordHash: { 
        type: String, 
        required: [ true, 'Password hash required'],
        minlength: [60 , 'ivalid hash length']
    },
    walletAddress:{ 
        type: String,
         default: ' ',
        trim: true,
        validate: {
            validator: function (v) {
              if (!v) return true; // allow empty
              // Basic Ethereum address check
              return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: props => `${props.value} is not a valid wallet address`
        }
    },
    totalTokens: { type: Number, default: 0, min: [0, 'Token count cannot be negative']
        
    },
    createdAt: { type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    isDasable: {type: Boolean, default: false},
}, {timestamps: true});

module.exports = mongoose.model("User", UserSchema);