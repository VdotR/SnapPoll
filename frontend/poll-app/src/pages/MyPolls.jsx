import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyPolls() {
    const [ polls, setPolls ] = useState([])
    const navigate = useNavigate();
    const identifier = sessionStorage.getItem('identifier');
    console.log(identifier)

    async function fetchPolls(identifier) {
        try {
            const res = await fetch(`http://localhost:3000/api/user/${identifier}/polls`);
            if (res.status == 401) {
                navigate('/login');
            }
            else if (!res.ok) {
                throw new Error(res);
            }
            setPolls(res);
        }
        catch (error) {
            console.log(error);
        }
    }

    // Effectively on page load
    useEffect(() => {
        if (identifier == null) {
            navigate('/login');
        }
        fetchPolls(identifier);
    }, []);

    return (
        <Page title="My Polls">
            <h2>Table of polls here </h2>
        </Page>
    );
}

export default MyPolls;