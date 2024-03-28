import Page from '../components/page'
import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';

function FindAvailablePoll() {
    const navigate = useNavigate();

    const [pollId, setPollId] = useState("");
    const [pollDetails, setPollDetails] = useState(null);

    async function fetchPollDetails(pollId) {
        try {
            const response = await fetch(`http://localhost:3000/api/poll/${pollId}`, {
                method: "GET",
                credentials: 'include',
            });
            const data = await response.json();
            setPollDetails(data);
            if (!response.ok || (data && !data._id)) {
                alert('Poll not found.');
            }
            else if(!data.available) alert('Poll not available');
            else navigate(`/vote/${pollId}`, { state: { pollDetails } }); // Navigate to the specific poll page
        } catch (error) {
            console.error("Error fetching poll details:", error);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        fetchPollDetails(pollId);
    };
    return (
        // Input form for poll ID on /vote/
        <Page>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={pollId}
                    onChange={(e) => setPollId(e.target.value)}
                    placeholder="Enter Poll ID"
                    required
                />
                <button type="submit">Submit</button>
            </form>
        </Page>
    );

}

export default FindAvailablePoll;