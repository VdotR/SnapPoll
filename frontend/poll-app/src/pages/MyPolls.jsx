import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context';

function MyPolls() {
    const [ polls, setPolls ] = useState([])
    const navigate = useNavigate();
    const { identifier } = useUserContext();

    async function fetchPolls(identifier) {
        try {
            const res = await fetch(`http://localhost:3000/api/user/${identifier}/polls`);
            if (res.status == 401) {
                navigate('/login');
            }
            setPolls(res);
        }
        catch (error) {
            console.log(error);
        }
    }

    // Effectively on page load
    useEffect(() => {
        fetchPolls(identifier);
    }, []);

    return (
        <Page title="My Polls">
            <h2>Table of polls here </h2>
        </Page>
    );
}

export default MyPolls;