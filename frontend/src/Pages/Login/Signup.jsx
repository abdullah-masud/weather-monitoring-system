import React from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


const Signup = () => {

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  return (
    <div className="px-2 flex min-h-screen justify-center items-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center block">Signup</h2>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    fetch("http://127.0.0.1:5000/api/signup", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify(form),
                    })
                        .then((res) => {
                            if (!res.ok) throw new Error("Signup failed");
                            return res.json();
                        })
                        .then(() => {
                            alert("Signup successful! Please login.");
                            navigate("/login");
                        })
                        .catch((err) => {
                            alert("Signup error. Email may already be registered.");
                            console.error(err);
                        });
                }}
            >
                {/* Name Field */}
                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text">Name</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Name"
                        className="input input-bordered w-full max-w-xs"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                    />
                </div>

                {/* Email Field */}
                <div className="form-control w-full max-w-xs mt-4">
                    <label className="label">
                        <span className="label-text">Email</span>
                    </label>
                    <input
                        type="email"
                        placeholder="Email"
                        className="input input-bordered w-full max-w-xs"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                    />
                </div>

                {/* Password Field */}
                <div className="form-control w-full max-w-xs mt-4">
                    <label className="label">
                        <span className="label-text">Password</span>
                    </label>
                    <input
                        type="password"
                        placeholder="Password"
                        className="input input-bordered w-full max-w-xs"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                    />
                </div>

                {/* Submit Button */}
                <input
                    type="submit"
                    className="btn btn-primary text-white w-full max-w-xs mt-6"
                    value="Signup"
                />
            </form>


            {/* Redirect to Login */}
            <p className="text-center font-semibold mt-4">
                <small>
                    Already have an account?
                    <Link className="text-secondary ml-1" to="/login">
                        Please Login
                    </Link>
                </small>
            </p>

            {/* Divider */}
            <div className="divider">OR</div>

            {/* Google Signup Button */}
            <button className="btn btn-outline btn-primary w-full">
            <span className="mr-2">
              <FcGoogle size={20}/>
            </span>
                Continue With Google
            </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
