import { useEffect, useState } from "react";

export default function CustomSignup() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [apiStatus, setApiStatus] = useState({ connected: false, testing: false });

    // Updated API URL to match your backend port
    const API_BASE_URL = "http://localhost:5000"; // Changed from 3001 to 5000

    // Check API connection and user login status
    useEffect(() => {
        checkApiConnection();
        checkExistingLogin();
    }, []);

    const checkApiConnection = async () => {
        setApiStatus(prev => ({ ...prev, testing: true }));
        try {
            const response = await fetch(`${API_BASE_URL}/`);
            if (response.ok) {
                setApiStatus({ connected: true, testing: false });
            } else {
                setApiStatus({ connected: false, testing: false });
            }
        } catch (error) {
            setApiStatus({ connected: false, testing: false });
        }
    };

    const checkExistingLogin = () => {
        // const token = localStorage.getItem('customAuthToken');
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decode JWT payload (basic decoding, not verification)
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = Date.now() / 1000;
                
                if (payload.exp && payload.exp > now) {
                    setCurrentUser({
                        id: payload.id,
                        email: payload.email,
                        username: payload.username
                    });
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
        
        if (serverError) {
            setServerError("");
        }
    };

    const validateEmail = (email) => {
        const trimmedEmail = email.trim().toLowerCase();
        const validDomain = '@gmail.com';

        if (!trimmedEmail.endsWith(validDomain)) {
            return { valid: false, message: 'Email must end with @gmail.com' };
        }

        const username = trimmedEmail.split('@')[0];
        if (!username.startsWith('pavan')) {
            return { valid: false, message: 'Email must start with letter "pavan"' };
        }

        return { valid: true, normalizedEmail: trimmedEmail };
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else {
            const validation = validateEmail(formData.email);
            if (!validation.valid) {
                newErrors.email = validation.message;
            }
        }
        
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        if (!apiStatus.connected) {
            setServerError("API server is not connected. Please check if the backend server is running.");
            return;
        }
        
        setIsSubmitting(true);
        setServerError("");
        setSuccessMessage("");
        
        try {
            const validation = validateEmail(formData.email);
            if (!validation.valid) {
                setServerError(validation.message);
                setIsSubmitting(false);
                return;
            }

            console.log('🚀 Attempting signup with custom API:', validation.normalizedEmail);
            
            // Updated endpoint to match backend
            const response = await fetch(`${API_BASE_URL}/user/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: validation.normalizedEmail,
                    password: formData.password
                })
            });

            const data = await response.json();
            console.log('📡 Custom API response:', data);

            if (response.ok && data.success) {
                const { token, user } = data;
                
                // Store token with custom key
                localStorage.setItem("token", token);
                
                // Set current user
                setCurrentUser(user);
                
                // Show success message
                setSuccessMessage(`🎉 Account created successfully! Welcome ${user.username}! Your data is now stored in the database.`);
                
                // Clear form
                setFormData({
                    email: "",
                    password: "",
                    confirmPassword: ""
                });
                
                console.log('✅ Signup successful - user stored in MySQL database via custom API');
                
            } else {
                setServerError(data.msg || 'Signup failed. Please try again.');
                console.error('❌ Signup failed:', data);
            }
            
        } catch (error) {
            console.error("💥 Signup error:", error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setServerError("Unable to connect to the custom API server. Please ensure the backend is running on " + API_BASE_URL);
            } else {
                setServerError("An error occurred during signup. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const testDatabaseConnection = async () => {
        try {
            setServerError("");
            const response = await fetch(`${API_BASE_URL}/test-db`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert(`✅ Database connected successfully!\n\nUser count: ${data.userCount}\nTimestamp: ${data.timestamp}`);
            } else {
                alert(`❌ Database connection failed!\nError: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`❌ Database test failed!\nError: ${error.message}`);
        }
    };

    const viewAllUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('📊 All users from database:', data.users);
                alert(`✅ Found ${data.count} users in database!\nCheck console for details.`);
            } else {
                alert('❌ Failed to fetch users from database!');
            }
        } catch (error) {
            alert(`❌ Error fetching users: ${error.message}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setSuccessMessage("");
    };

    // If user is logged in, show dashboard
    if (currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-lg">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-green-600">🎉 Welcome to CampusHub!</h2>
                            <p className="text-gray-600 mt-2">Account created with custom API</p>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                            <h3 className="font-medium text-green-800 mb-2">✅ Database User Information:</h3>
                            <div className="space-y-1 text-sm text-green-700">
                                <p><span className="font-medium">Email:</span> {currentUser.email}</p>
                                <p><span className="font-medium">Username:</span> {currentUser.username}</p>
                                <p><span className="font-medium">User ID:</span> {currentUser.id}</p>
                                <p><span className="font-medium">Role:</span> Student</p>
                            </div>
                            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-600">
                                🗄️ This data is stored in your MySQL database via custom Node.js API
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300 font-medium"
                            >
                                🚪 Logout
                            </button>
                            
                            <button
                                onClick={testDatabaseConnection}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 font-medium"
                            >
                                🔍 Test Database Connection
                            </button>
                            
                            <button
                                onClick={viewAllUsers}
                                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300 font-medium"
                            >
                                👥 View All Users in DB
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900">🎓 CampusHub</h1>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                        Sign in
                    </span>
                </p>
                
                {/* API Status Indicator */}
                <div className="mt-3 text-center">
                    {apiStatus.testing ? (
                        <p className="text-xs text-yellow-600">🔄 Checking API connection...</p>
                    ) : apiStatus.connected ? (
                        <p className="text-xs text-green-600">✅ Custom API Connected - Ready for Database Storage</p>
                    ) : (
                        <p className="text-xs text-red-600">❌ API Not Connected - Please start backend server</p>
                    )}
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {serverError && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <p className="mt-1 text-sm text-red-700">{serverError}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">{successMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address *
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border ${
                                        errors.email ? "border-red-300" : "border-gray-300"
                                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="pavan@gmail.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    📧 Must start with 'pavan' and end with '@gmail.com'
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border ${
                                        errors.password ? "border-red-300" : "border-gray-300"
                                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    🔒 Minimum 6 characters (will be bcrypt hashed in database)
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border ${
                                        errors.confirmPassword ? "border-red-300" : "border-gray-300"
                                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="••••••••"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !apiStatus.connected}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating account...
                                    </div>
                                ) : !apiStatus.connected ? (
                                    "⚠️ API Not Connected"
                                ) : (
                                    "🚀 Create Account in Database"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Debug/Testing Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">🔧 Development Tools:</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={checkApiConnection}
                                className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                                🔄 Test API Connection
                            </button>
                            <button
                                onClick={testDatabaseConnection}
                                className="text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                            >
                                🗄️ Test Database Connection
                            </button>
                            <button
                                onClick={viewAllUsers}
                                className="text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors"
                            >
                                👥 View All Database Users
                            </button>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 space-y-1">
                            <p>📍 <strong>API URL:</strong> {API_BASE_URL}</p>
                            <p>🔌 <strong>Status:</strong> {apiStatus.connected ? 'Connected' : 'Disconnected'}</p>
                            <p>💾 <strong>Storage:</strong> MySQL Database via Custom Node.js API</p>
                            <p>🔐 <strong>Auth:</strong> JWT Token with localStorage</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    By signing up, you agree to our terms and conditions
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Go back to <span className="text-blue-500 cursor-pointer font-medium hover:underline">Home</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Backend Setup Instructions */}
                    {!apiStatus.connected && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Backend Setup Required</h4>
                            <div className="text-xs text-yellow-700 space-y-1">
                                <p>1. Create the custom Node.js API server</p>
                                <p>2. Install dependencies: express, mysql2, bcrypt, jwt, cors</p>
                                <p>3. Configure database connection in .env file</p>
                                <p>4. Start server: <code className="bg-yellow-100 px-1 rounded">npm run dev</code></p>
                                <p>5. Server should run on: <strong>{API_BASE_URL}</strong></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}