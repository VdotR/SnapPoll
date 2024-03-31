import Page from '../components/page'
import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import { fetchPollDetails } from '../utils/pollUtils';
import { useUserContext } from '../../context';

function FindAvailablePoll() {
    const navigate = useNavigate();

    const [pollId, setPollId] = useState("");
    const [pollDetails, setPollDetails] = useState(null);
    const {pushAlert } = useUserContext();
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        fetchPollDetails(pollId)
        .then(data => {
            setPollDetails(data);
            
            if (data && !data._id) {
                pushAlert('Poll not found.', 'error');
            } else if (!data.available) {
                pushAlert('Poll not available', 'error');
            } else {
                navigate(`/vote/${pollId}`, { state: { pollDetails: data } }); // Navigate with poll details
            }
        })
        .catch(error => {
            console.error("Error fetching poll details:", error);
            pushAlert('An error occurred while fetching poll details.', 'error');
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