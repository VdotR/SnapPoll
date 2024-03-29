import Page from '../components/page'
import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import { fetchPollDetails } from '../utils/pollUtils';

function FindAvailablePoll() {
    const navigate = useNavigate();

    const [pollId, setPollId] = useState("");
    const [pollDetails, setPollDetails] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        fetchPollDetails(pollId)
        .then(data => {
            setPollDetails(data);
            
            if (data && !data._id) {
                alert('Poll not found.');
            } else if (!data.available) {
                alert('Poll not available');
            } else {
                navigate(`/vote/${pollId}`, { state: { pollDetails: data } }); // Navigate with poll details
            }
        })
        .catch(error => {
            console.error("Error fetching poll details:", error);
            alert('An error occurred while fetching poll details.');
        });
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