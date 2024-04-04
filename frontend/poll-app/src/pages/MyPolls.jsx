import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context';
import Loading from '../components/loading';
import config from '../config';
import { getDialogText, truncate } from '../utils/pollUtils';

// https://react-icons.github.io/react-icons/icons/fa/
import { FaPlus, FaRedo, FaAngleUp, FaAngleDown, FaEraser, FaTrashAlt } from 'react-icons/fa';
import Dialog from '../components/dialog';

function MyPolls() {
    const [polls, setPolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { username, pushAlert } = useUserContext();

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
        const sortedPolls = [...polls].sort((a,b) => {
            if (col == dateCol) {
                return order?
                    (new Date(b[col]) - new Date(a[col])) 
                    : (new Date(a[col]) - new Date(b[col]));
            }
            return order?
                (b[col] > a[col]? 1 : -1)
                : (a[col] > b[col]? 1 : -1);
        });
        setPolls(sortedPolls);
    }

    // Link to poll details, ignore clicks on checkbox and icons
    function handleRowClick(e, id) {
        console.log(e.target.tagName.toLowerCase())
        if (!['svg', 'button', 'input', 'path'].includes(e.target.tagName.toLowerCase())) {
            navigate(`/poll/${id}`);
        }
    }

    // Delete a poll
    function deletePoll(poll) {
        fetch(`http://localhost:3000/api/poll/${poll._id}/`, {
            method: "DELETE",
            credentials: 'include'
        })
        .then(() => pushAlert(`Deleted poll \"${truncate(poll.question)}\"`))
        .then(() => fetchPolls(username))
        .catch(error => console.log(error))

    }

    // Clear a poll's responses
    function clearPoll(poll) {
        console.log(`http://localhost:3000/api/poll/${poll._id}/clear`)
        fetch(`http://localhost:3000/api/poll/${poll._id}/clear`, {
            method: "PATCH",
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                pushAlert('Failed to clear poll responses', 'error');
            }
        })
        .then(() => pushAlert(`Cleared poll \"${truncate(poll.question)}\"`))
        .then(() => setPolls(prevPolls => prevPolls.map(p => {
            if (p._id === poll._id) {
                // Return a new object with the updated available property
                return { ...p, responses: [] };
            }
            return p;
        })))
        .catch(error => console.log(error))
    }

    // Toggle poll availability
    async function toggleAvailable(poll) {
        console.log(`${config.BACKEND_BASE_URL}/api/poll/${poll.available ? 'close' : 'open'}/${poll._id}`);
        try {
            const action = poll.available ? 'close' : 'open';
            const response = await fetch(`${config.BACKEND_BASE_URL}/api/poll/${action}/${poll._id}`, {
                method: "PATCH",
                credentials: config.API_REQUEST_CREDENTIALS_SETTING
            });
    
            if (response.status === 401) {
                navigate('/login');
                return; 
            }
            if (response.status != 200) {
                alert("Failed to change vote availability.");
                return;
            }
            setPolls(prevPolls => prevPolls.map(p => {
                if (p._id === poll._id) {
                    // Return a new object with the updated available property
                    return { ...p, available: !p.available };
                }
                return p;
            }));
            pushAlert(`${action == 'close'? 'Closed' : 'Opened'} poll \"${truncate(poll.question)}\"`);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function fetchPolls(username) {
        setIsLoading(true);
        fetch(`${config.BACKEND_BASE_URL}/api/user/created_polls/${username}`, { 
            credentials: config.API_REQUEST_CREDENTIALS_SETTING 
        })
        .then(res => {
            if (res.status == 401) {
                navigate('/login');
                throw new Error(res.statusText)
            }
            return res.json();
        })
        .then(data => setPolls(data))
        .catch(error => console.log(error))
        .finally(() => {
            setIsLoading(false);
        })
    }

    useEffect(() => {
        fetchPolls(username);
    }, []);

    return (
        <Page title="My Polls">  
            <>
            <div className='toolbar'>
                <button onClick={() => navigate("/polls/create")}><FaPlus /> New Poll</button>
                <button onClick={() => fetchPolls(username)}><FaRedo /></button>
            </div>
            <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            {tableCols.map(col => {
                                return <th className='no-select' key={col} onClick={() => handleSort(col)}>
                                    {toName(col)} {sortOrder[col]? <FaAngleDown /> : <FaAngleUp />  }
                                </th>
                            })}
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {polls.map(poll => {
                            return <tr onClick={(e) => handleRowClick(e, poll._id)} key={poll._id}>
                                <td><span>{poll.question}</span></td>
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
                                <td><Dialog
                                    title='Confirm clear poll'
                                    text={getDialogText(`clear the responses for "${truncate(poll.question)}"`)} 
                                    onConfirm={() => clearPoll(poll)} 
                                    target={<FaEraser />}
                                /></td>
                                <td><Dialog
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
            {isLoading? <Loading />:
            polls.length == 0? <p> You haven't created any polls.</p>: <></>
            } 
            </>
        </Page>
    );
}

export default MyPolls;