"use client";

import { useEffect, useState, FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoggingIn(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success will automatically trigger onAuthStateChanged
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError("Failed to log in. Please check your connection and credentials.");
      }
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "16px", color: "#64748b", fontSize: "14px" }}>Authenticating...</p>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // If user is authenticated, render the protected children
  if (user) {
    return <>{children}</>;
  }

  // If not authenticated, render the dark-themed login screen
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <div style={styles.iconBox}>🛡️</div>
          <h2 style={styles.loginTitle}>Agent Dashboard</h2>
          <p style={styles.loginSubtitle}>Sign in to manage WhatsApp conversations</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@visriva.com"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loggingIn}
            style={{
              ...styles.submitBtn,
              opacity: loggingIn ? 0.7 : 1,
              cursor: loggingIn ? "wait" : "pointer"
            }}
          >
            {loggingIn ? "Signing In..." : "Sign In to Dashboard"}
          </button>
        </form>
        
        <div style={styles.footerInfo}>
          <p>Protected area. Ensure you have enabled Email/Password sign-in in your Firebase Console.</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0e1a",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loginContainer: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0e1a",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  loginCard: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#0f1629",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  loginHeader: {
    textAlign: "center",
    marginBottom: "32px",
  },
  iconBox: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  loginTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 8px 0",
  },
  loginSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#94a3b8",
  },
  input: {
    padding: "12px 16px",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  errorBox: {
    padding: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: "13px",
    textAlign: "center",
  },
  submitBtn: {
    marginTop: "8px",
    padding: "14px",
    backgroundColor: "#6366f1",
    backgroundImage: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
  },
  footerInfo: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "12px",
    color: "#475569",
    lineHeight: "1.5",
  },
};
