import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context';
import Loading from '../components/loading';
import { availablePollRequest, clearPollRequest, createPollRequest, deletePollRequest, getDialogText, truncate } from '../utils/pollUtils';
import { createdPollsRequest } from '../utils/userUtils';

// https://react-icons.github.io/react-icons/icons/fa/
import { FaPlus, FaRedo, FaAngleUp, FaAngleDown, FaEraser, FaTrashAlt } from 'react-icons/fa';
import Dialog from '../components/dialog';

function MyPolls() {
    const [polls, setPolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { userId, username, pushAlert } = useUserContext();

    // Table column names
    const dateCol = "date_created"
    const tableCols = ["question", dateCol, "responses", "available"];

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

    // Link to poll details, ignore clicks on checkbox and icons
    function handleRowClick(e, id) {
        if (!['span', 'svg', 'button', 'input', 'path'].includes(e.target.tagName.toLowerCase())) {
            navigate(`/poll/${id}`);
        }
    }
    async function clearPoll(poll) {
        clearPollRequest(poll._id).then(res => {
            if (!res.ok) throw new Error();
        })
            .then(() => pushAlert(`Cleared poll \"${truncate(poll.question)}\"`))
            .then(() => setPolls(prevPolls => prevPolls.map(p => {
                if (p._id === poll._id) {
                    // Return a new object with the updated available property
                    return { ...p, responses: [] };
                }
                return p;
            })))
            .catch((error) => { pushAlert('Failed to clear poll responses', 'error') });
    }
    // Delete a poll
    function deletePoll(poll) {
        deletePollRequest(poll._id)
            .then((response) => {
                if (response.status === 200) {
                    pushAlert(`Deleted poll \"${truncate(poll.question)}\"`);
                }
            })
            .then(() => fetchPolls(userId))
            .catch((error) => { pushAlert(`Error deleting poll \"${truncate(poll.question)}\"`) });
    }

    // Toggle poll availability
    async function toggleAvailable(poll) {
        const action = poll.available ? false : true;
        try {
            const response = await availablePollRequest(poll._id, action);

            if (response.status === 401) {
                navigate('/login');
                return;
            }
            if (response.status !== 200) {
                throw new Error();
            }

            setPolls(prevPolls => prevPolls.map(p => {
                if (p._id === poll._id) {
                    // Return a new object with the updated available property
                    return { ...p, available: !p.available };
                }
                return p;
            }));
            pushAlert(`${action === false ? 'Closed' : 'Opened'} poll \"${truncate(poll.question)}\"`);
        } catch (err) {
            pushAlert("Failed to change vote availability.", 'error');
        }
    }

    async function fetchPolls(userId) {
        setIsLoading(true);
        try {
            const response = await createdPollsRequest(userId);
            if (response.status === 401) {
                navigate('/login');
            }
            else {
                const data = await response.json();
                setPolls(data);
            }
        } catch (err) {
            pushAlert("Failed to fetch polls", 'error');
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchPolls(userId);
    }, []);

    const createQuickPoll = async () => {
        // Get current date
        let currentDate = new Date();
        let dateString = currentDate.toLocaleDateString();
        let timeString = currentDate.toLocaleTimeString();

        // Create a question string based on current date and time
        const question = `Quick Poll ${dateString} ${timeString}`;
        const correct_option = -1;
        const options = ["A", "B", "C", "D", "E"];
        try {
            const response = await createPollRequest(question, correct_option, options);
            if (!response.ok) {
                throw new Error();
            }
            else pushAlert("Created quick poll!");
            await fetchPolls(userId);
        }
        catch (err) {
            pushAlert("Failed to create poll", 'error');
        }
    };

    return (
        <Page title="My Polls">
            <>
                <div className='toolbar'>
                    <button onClick={() => navigate("/polls/create")}><FaPlus /> New Poll</button>
                    <button onClick={() => createQuickPoll()}><FaPlus /> Quick Poll</button>
                    <button onClick={() => fetchPolls(userId)}><FaRedo /></button>
                </div>
                <div className='table-container'>
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
                                return <tr onClick={(e) => handleRowClick(e, poll._id)} key={poll._id}>
                                    <td className='truncate'>{poll.question}</td>
                                    <td className='table-date'> {
                                        new Date(poll.date_created).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })
                                    } </td>
                                    {/* <td><input type='checkbox' onChange={() => toggleAvailable(poll)} checked={poll.available}></input></td> */}
                                    <td>{poll.responses.length}</td>
                                    <td><input type='checkbox' onChange={() => toggleAvailable(poll)} checked={poll.available}></input></td>
                                    <td className='table-action'><Dialog
                                        title='Confirm clear poll'
                                        text={getDialogText(`clear the responses for "${truncate(poll.question)}"`)}
                                        onConfirm={() => clearPoll(poll)}
                                        target={<FaEraser />}
                                    /></td>
                                    <td className='table-action'><Dialog
                                        title='Confirm poll deletion'
                                        text={getDialogText(`delete the poll "${truncate(poll.question)}"`)}
                                        onConfirm={() => deletePoll(poll)}
                                        target={<FaTrashAlt />}
                                    /></td>
                                </tr>
                            })}
                        </tbody>
                    </table>
                </div>
                {isLoading ? <Loading /> :
                    polls.length == 0 ? <p> You haven't created any polls.</p> : <></>
                }
            </>
        </Page>
    );
}

export default MyPolls;