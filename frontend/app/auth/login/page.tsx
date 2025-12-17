"use client";

import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const LOGIN_MUTATION = gql`
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      access_token
      user {
        id
        email
        role
      }
    }
  }
`;

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const [login, { loading, error }] = useMutation(LOGIN_MUTATION);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await login({
                variables: {
                    loginInput: {
                        email,
                        password,
                    },
                },
            });

            if (data?.login?.access_token) {
                Cookies.set("token", data.login.access_token);
                // Simple role check for redirect, though ideally backend handles permissions
                if (data.login.user.role === "VET") {
                    router.push("/vet/dashboard");
                } else {
                    router.push("/owner/dashboard");
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={`flex min-h-screen flex-col items-center justify-center p-6 bg-[#FFF9F4] ${nunito.className}`}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white/50">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-[#E6FFFA] rounded-full flex items-center justify-center mx-auto mb-6 text-[#8AD6C6] text-4xl shadow-sm">
                        <i className="fas fa-paw"></i>
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#4A5568] tracking-tight mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-[#A0AEC0] font-medium">
                        Sign in to your PawBook account
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="relative group">
                            <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#8AD6C6] transition-colors"></i>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-[20px] border-none bg-gray-50 py-4 pl-12 pr-4 text-gray-700 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-[#8AD6C6] focus:bg-white transition-all shadow-inner"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#8AD6C6] transition-colors"></i>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full rounded-[20px] border-none bg-gray-50 py-4 pl-12 pr-4 text-gray-700 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-[#8AD6C6] focus:bg-white transition-all shadow-inner"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm font-bold text-center p-3 rounded-xl flex items-center justify-center gap-2">
                            <i className="fas fa-exclamation-circle"></i>
                            {error.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#8AD6C6] text-white py-4 rounded-[20px] text-lg font-bold shadow-[0_8px_20px_rgba(138,214,198,0.4)] hover:bg-[#76BDB0] hover:shadow-[0_12px_24px_rgba(138,214,198,0.5)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed group flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Signing in...
                            </>
                        ) : (
                            <>
                                Sign In <i className="fas fa-arrow-right opacity-70 group-hover:translate-x-1 transition-transform"></i>
                            </>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <Link href="/auth/register" className="text-[#8AD6C6] font-bold hover:text-[#76BDB0] transition-colors text-sm">
                            Don't have an account? <span className="underline decoration-2 underline-offset-4">Create one</span>
                        </Link>
                    </div>
                </form>
            </div>

            <p className="mt-8 text-center text-xs text-gray-300 font-bold">
                &copy; 2024 PawBook. Vet Verified.
            </p>
        </div>
    );
}
