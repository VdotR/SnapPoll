import Page from '../components/page'
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

function Vote() {
    const navigate = useNavigate();
    const location = useLocation();
    const { poll_id } = useParams();

    const [pollDetails, setPollDetails] = useState(location.state?.pollDetails || null);

    // Function to fetch poll details if not provided
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
                navigate(`/vote`);
            }
            else if (!data.available) {
                alert('Poll not available');
                navigate(`/vote`);
            }
        } catch (error) {
            console.error("Error fetching poll details:", error);
        }
    }

    useEffect(() => {
        if (!pollDetails) {
            fetchPollDetails(poll_id);
        }
    }, [pollDetails]);

    // Function to handle answer submission
    const submitAnswer = async (answerIndex) => {
        try {
            const response = await fetch(`http://localhost:3000/api/poll/vote/${poll_id}`, {
                method: "PATCH",
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answer: answerIndex,
                })
            });

            if (response.status === 400) {
                throw new Error('Poll not available.');
            }
            else if (response.status === 500) {
                throw new Error('Error: Response was not recorded.');
            }
            const result = await response.json();
            alert('Vote submitted successfully!');
        } catch (error) {
            console.error("Error submitting vote:", error);
            alert(error.message);
        }
    };

    return (
        // Display poll details for /vote/:poll_id
        <Page>
            {pollDetails ? (
                <div>
                    <h2>{pollDetails.question}</h2>
                    <div>
                        {pollDetails.options.map((option, index) => (
                            <button key={index} onClick={() => submitAnswer(index)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <p>Loading poll information...</p>
            )}
        </Page>
    );

}

export default Vote;