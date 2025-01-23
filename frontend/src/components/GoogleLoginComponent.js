import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";

const GoogleLoginComponent = ({ onLoginSuccess }) => {
    // console.log("HERE HERE HERE");
    const navigate = useNavigate();
    const responseGoogle = (response) => {
        if (response.profileObj) {
            navigate("/fileUpload");
        }
        navigate("/fileUpload");
    }


    return (
        <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100vh", justifyContent: "center"}}
        >
            <div style={{ width: "350px", textAlign: "center" }}>
                <h1>Data Annotator</h1>
                <form>
                    <div style={{ marginBottom: "10px" }}>
                        <input
                            type="text"
                            placeholder="Email Address or Username"
                            name="username"
                            style={{ width: "100%", padding: "10px", borderRadius: "10px" }}
                        />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            style={{ width: "100%", padding: "10px", borderRadius: "10px" }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            background: "#00796b",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 15px",
                            cursor: "pointer",
                            marginBottom: "10px"
                        }}
                    >
                        Sign In
                    </button>
                </form>
            </div>
            <div>
                or
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px", marginTop: "10px" }}>
                <GoogleLogin
                    onSuccess={responseGoogle}
                    onFailure={() => {
                        // console.log("HERE3 HERE3 HERE3");
                        console.log('Login Failed');
                    }}
                />
            </div>
        </div>
    );
}

export default GoogleLoginComponent;