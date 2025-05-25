import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  return (
    <div className="px-2 flex min-h-screen justify-center items-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center block">Signup</h2>

          <form onSubmit={(e) => {
            e.preventDefault();
            fetch("/api/signup", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(form),
            })
              .then((res) => {
                if (!res.ok) throw new Error("Signup failed");
                return res.json();
              })
              .then((data) => {
                localStorage.setItem("jwt", data.token);
                localStorage.setItem("email", data.user.email);
                navigate("/dashboard");
              })
              .catch((err) => {
                alert("Registration failed: " + err.message);
                console.error(err);
              });
          }}>
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
            <button
              type="submit"
              className="btn btn-primary text-white w-full max-w-xs mt-6"
            >
              Signup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
