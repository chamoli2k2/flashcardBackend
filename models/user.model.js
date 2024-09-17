import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },

    email: { 
        type: String, 
        required: true, 
        unique: true 
    },

    password: { 
        type: String, 
        required: true 
    },

    folders: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Folder" 
        }
    ],

    image: {
      type: String,
      default: 'https://img.icons8.com/fluency/48/test-account--v1.png'
    },

    otpHash: { 
        type: String 
    },

    otpExpiry: { 
        type: Date 
    },

    deletionRequested: { 
      type: Boolean, 
      default: false 
    },
      
    deletionRequestDate: { 
        type: Date 
    },

    lastLogin: { 
        type: Date 
    },

  },

  { 
    timestamps: true 
  }
  
);

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
      next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// OTP verification method
userSchema.methods.verifyOtp = async function (enteredOtp) {
  if (!this.otpExpiry || this.otpExpiry < Date.now()) {
    throw new Error('OTP has expired');
  }
  return await bcrypt.compare(enteredOtp, this.otpHash);
};

// Method to set OTP and its expiry
userSchema.methods.setOtp = async function (otp) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(otp, salt);
  this.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
};

// Method to update the last login time
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
};



const User = mongoose.model("User", userSchema);
export default User;
