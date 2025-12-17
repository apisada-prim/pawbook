"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, ApolloProvider } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useMemo } from "react";
import Cookies from "js-cookie";

function makeClient() {
    const httpLink = new HttpLink({
        uri: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/graphql` : "http://localhost:4000/graphql",
    });

    const authLink = setContext((_, { headers }) => {
        const token = Cookies.get("token");
        return {
            headers: {
                ...headers,
                Authorization: token ? `Bearer ${token}` : "",
            }
        };
    });

    return new ApolloClient({
        cache: new InMemoryCache(),
        link: authLink.concat(httpLink),
    });
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
    const client = useMemo(() => makeClient(), []);

    return (
        <ApolloProvider client={client}>
            {children}
        </ApolloProvider>
    );
}
