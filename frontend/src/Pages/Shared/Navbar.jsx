import React from "react";
import { Link } from "react-router";

const Navbar = () => {
  const menuItems = (
    <>
      <li className="hover:text-accent hover:underline cursor-pointer font-semibold text-base mr-6">
        <Link to="/">Home</Link>
      </li>
      <li className="hover:text-accent hover:underline cursor-pointer font-semibold text-base mr-6">
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li className="hover:text-accent hover:underline cursor-pointer font-semibold text-base mr-6">
        <Link to="/prediction">Prediction</Link>
      </li>
    </>
  );

  return (
    <div className="bg-[#f1f1f1]">
      <div className="navbar  max-w-7xl mx-auto">
        <div className="navbar-start">
          <div className="dropdown">
            <label tabIndex="0" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </label>
            <ul
              tabIndex="0"
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
            >
              {menuItems}
            </ul>
          </div>
          <Link to="/" className="normal-case text-xl font-bold">
            Weather Monitoring System
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu-horizontal p-0">{menuItems}</ul>
        </div>

        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <label tabIndex="1" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  src="https://i.ibb.co/4pDNDk1/avatar.png"
                  alt="Default Avatar"
                />
              </div>
            </label>
            <ul
              tabIndex="0"
              className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52"
            >
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
