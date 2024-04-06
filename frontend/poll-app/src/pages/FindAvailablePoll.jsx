import Page from '../components/page'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPollDetails } from '../utils/pollUtils';
import { useUserContext } from '../../context';
import Loading from '../components/loading';
import config from '../config';
import { FaAngleUp, FaAngleDown } from 'react-icons/fa';

function FindAvailablePoll() {
    const navigate = useNavigate();

    const [polls, setPolls] = useState([]);
    const [pollId, setPollId] = useState("");
    const { userId, username, pushAlert } = useUserContext();
    const [isLoading, setIsLoading] = useState(true);
    const dateCol = "date_answered"
    const tableCols = ["question", dateCol, "available", "chosen_answer"];

    // Replace underscore with space and capitalize each word 
    function toName(str) {
        return str.replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    // Indicates if column sorted in "default" order
    // (newest-to-oldest if date and reverse-alphabetical otherwise)
    let defaultSortOrder = {};
    tableCols.forEach(col => defaultSortOrder[col] = true);
    const [sortOrder, setSortOrder] = useState(defaultSortOrder);

    // Sort entries in a table column
    function handleSort(col) {
        // Toggle sort order for column
        const newSortOrder = sortOrder;
        newSortOrder[col] = !sortOrder[col];
        setSortOrder(newSortOrder);
        const order = sortOrder[col];
        const sortedPolls = [...polls].sort((a, b) => {
            if (col == dateCol) {
                return order ?
                    (new Date(b[col]) - new Date(a[col]))
                    : (new Date(a[col]) - new Date(b[col]));
            }
            return order ?
                (b[col] > a[col] ? 1 : -1)
                : (a[col] > b[col] ? 1 : -1);
        });
        setPolls(sortedPolls);
    }

    // Link to poll vote page if available, ignore clicks on checkbox and icons
    function handleRowClick(e, id, available) {
        if (!['input', 'path'].includes(e.target.tagName.toLowerCase())) {
            if (available) navigate(`/vote/${id}`);
            else pushAlert('Poll not available', 'error');
        }
    }

    async function fetchAnsweredPolls(username) {
        setIsLoading(true);
        fetch(`${config.BACKEND_BASE_URL}/api/user/${userId}`, {
            credentials: config.API_REQUEST_CREDENTIALS_SETTING
        })
            .then(res => {
                if (res.status == 401) {
                    navigate('/login');
                    throw new Error(res.statusText)
                }
                return res.json();
            })
            .then(data => {
                // Assuming data.answered_poll_id is an array of poll IDs
                const pollDetailsPromises = data.answered_poll_id.map(pollId =>
                    fetch(`${config.BACKEND_BASE_URL}/api/poll/${pollId}`, {
                        credentials: config.API_REQUEST_CREDENTIALS_SETTING
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch poll details');
                            }
                            return response.json();
                        })
                        .catch(error => {
                            console.error(`Error fetching details for poll ID ${pollId}:`, error);
                            return null; // Return a null or similar to indicate a failed fetch
                        })
                );

                // Wait for all poll detail fetches to complete, including those that might have failed
                return Promise.all(pollDetailsPromises);
            })
            .then(pollDetails => {
                // Filter out any nulls (failed fetches) and update state with the successful fetches
                const successfulPollDetails = pollDetails.filter(detail => detail !== null);
                setPolls(successfulPollDetails);
            })
            .catch(error => console.log(error))
            .finally(() => {
                setIsLoading(false);
            });
    }

    useEffect(() => {
        fetchAnsweredPolls(username);
    }, []);



    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        fetchPollDetails(pollId)
            .then(data => {
                if (data && !data._id) {
                    pushAlert('Poll not found.', 'error');
                } else if (!data.available) {
                    pushAlert('Poll not available', 'error');
                } else {
                    navigate(`/vote/${data._id}`, { state: { pollDetails: data } }); // Navigate with poll details
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
            <h2>Find Poll By ID</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={pollId}
                    onChange={(e) => setPollId(e.target.value)}
                    placeholder="Enter Poll ID"
                    required
                />
                <button className='submit-btn' type="submit">Submit</button>
            </form>
            <h2>Answered Polls</h2>
            <table>
                <thead>
                    <tr>
                        {tableCols.map(col => {
                            return <th className='no-select' key={col} onClick={() => handleSort(col)}>
                                {toName(col)} {sortOrder[col] ? <FaAngleDown /> : <FaAngleUp />}
                            </th>
                        })}
                        <th></th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {polls.map(poll => {
                        const userResponse = poll.responses.find(response => response.user === userId);
                        return (
                            <tr onClick={(e) => handleRowClick(e, poll._id, poll.available)} key={poll._id}>
                                <td><span>{poll.question}</span></td>
                                <td> {
                                    new Date(userResponse.updatedAt).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })
                                } </td>
                                <td>{poll.available ? 'Yes' : 'No'}</td>
                                {/* Display the user's answer, if available */}
                                <td>{poll.options[userResponse.answer]}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {isLoading ? <Loading /> :
                polls.length == 0 ? <p> You haven't answered any polls.</p> : <></>
            }
        </Page>
    );

}

export default FindAvailablePoll;