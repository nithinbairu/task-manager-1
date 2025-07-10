const jwt=require("jsonwebtoken")
const bcrypt=require("bcryptjs")
const Admin=require("../models/Admin");


module.exports.adminRegister=async(req,res)=>{
try{    const {name,email,password}=req.body;
    if(!name||!email||!password){
        return res.status(400).json({message:"Name, Email, Password are required"});
    }

    const existingAdmin=await Admin.findOne({email});
    if(existingAdmin){
        return res.status(400).json({message:"Admin is already exist"});
    }
    const role="admin"
    const bpass=await bcrypt.hash(password,10);
    const admin=await Admin.create({name,email,password:bpass,role})

    return res.status(201).json({message:"Admin Registered Successfully",admin:{id:admin._id,name:admin.name,email:User.email,role:admin.role}})
}catch(err){
    return res.status(400).json({message:"Registration Failed",error:err.message})
}

}

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    

    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(401).json({ message: 'Invalid email' });

    if (!admin.password) {
      return res.status(400).json({ message: 'This account uses Google login. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    res.json({ token, admin });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(400).json({ message: 'Login failed', error: err.message });
  }
};