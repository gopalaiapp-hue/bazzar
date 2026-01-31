import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { apiUrl } from '@/lib/api-config';

export default function DebugPage() {
    const { user } = useUser();
    const [apiUser, setApiUser] = useState<any>(null);

    useEffect(() => {
        if (user?.id) {
            fetch(apiUrl(`/api/users/${user.id}`))
                .then(res => res.json())
                .then(data => setApiUser(data))
                .catch(err => setApiUser({ error: err.message }));
        }
    }, [user]);

    return (
        <div className="p-10 font-mono text-sm">
            <h1>Debug Info</h1>
            <h2>Context User</h2>
            <pre className="bg-gray-100 p-4">{JSON.stringify(user, null, 2)}</pre>

            <h2>API User</h2>
            <pre className="bg-blue-100 p-4">{JSON.stringify(apiUser, null, 2)}</pre>
        </div>
    );
}
