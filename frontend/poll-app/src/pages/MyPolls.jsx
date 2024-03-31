import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context';
import Loading from '../components/loading';

// https://react-icons.github.io/react-icons/icons/fa/
import { FaPlus, FaRedo, FaAngleUp, FaAngleDown, FaEraser, FaTrashAlt } from 'react-icons/fa';

function MyPolls() {
    const [polls, setPolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { identifier, setAlert } = useUserContext();

    // Table column names
    const dateCol = "date_created"
    const tableCols = ["question", dateCol, "responses", "available"];
    const actionClass = "table-action";

    // Replace underscore with space and capitalize each word 
    function toName(str) {
        return str.replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    }

    // Truncate and add ellipsis for long poll name
    function truncate(str) {
        if (str.length > 20) {
            return str.substring(0, 20) + "...";
        }
        return str;
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
    function handleRowClick(e, shortId) {
        if (e.target.tagName.toLowerCase() in ['input', 'path']) {
          navigate(`/poll/${shortId}`);  
        }        
    }

    // Delete a poll
    function deletePoll(poll) {
        console.log(`http://localhost:3000/api/poll/${poll._id}`)
        fetch(`http://localhost:3000/api/poll/${poll._id}/`, {
            method: "DELETE",
            credentials: 'include'
        })
        .then(() => setAlert({
            message: `Deleted poll \"${truncate(poll.question)}\"`,
            level: 'info'
        }))
        .then(() => fetchPolls(identifier))
        .catch(error => console.log(error))

    }

    // Clear a poll's responses
    function clearPoll(poll) {
        console.log(`http://localhost:3000/api/poll/${poll._id}/clear`)
        fetch(`http://localhost:3000/api/poll/${poll._id}/clear`, {
            method: "PATCH",
            credentials: 'include'
        })
        .then(() => setAlert({
            message: `Cleared poll \"${truncate(poll.question)}\"`,
            level: 'info'
        }))
        .then(() => fetchPolls(identifier))
        .catch(error => console.log(error))

    }

    // Toggle poll availability
    async function toggleAvailable(poll) {
        const action = poll.available? 'close' : 'open';
        fetch(`http://localhost:3000/api/poll/${action}/${poll._id}`, {
            method: "PATCH",    
            credentials: 'include'
        })
        .then(res => {
            if (res.status == 401) {
                navigate('/login');
                throw new Error(res.statusText)
            }
        })
        .then(() => fetchPolls(identifier))
        .then(() => setAlert({
            message: `${action == 'close'? 'Closed' : 'Opened'} poll \"${truncate(poll.question)}\"`,
            level: 'info'
        }))
        .catch(error => console.log(error))
    }

    async function fetchPolls(identifier) {
        setIsLoading(true);
        fetch(`http://localhost:3000/api/user/created_polls/${identifier}`, { 
            credentials: 'include' 
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
        fetchPolls(identifier);
    }, []);

    // TODO: delete and clear poll
    
    return (
        <Page title="My Polls">  
            <>
            <div className='toolbar'>
                <button onClick={() => navigate("/polls/create")}><FaPlus /> New Poll</button>
                <button onClick={() => fetchPolls(identifier)}><FaRedo /></button>
            </div>
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
                        return <tr onClick={(e) => handleRowClick(e, poll.shortId)} key={poll._id}>
                            <td><span>{poll.question}</span></td>
                            <td> {
                                new Date(poll.date_created).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                })
                            } </td>
                            <td>{poll.responses.length}</td>
                            <td><input type='checkbox' onClick={() => toggleAvailable(poll)} defaultChecked={poll.available}></input></td>
                            <td><FaEraser onClick={() => clearPoll(poll)} /></td>
                            <td><FaTrashAlt onClick={() => deletePoll(poll)} /></td>
                        </tr>
                    })}
                </tbody>
            </table>
            {isLoading? <Loading />:
            polls.length == 0? <p> You haven't created any polls.</p>: <></>} 
            </>
        </Page>
    );
}

export default MyPolls;