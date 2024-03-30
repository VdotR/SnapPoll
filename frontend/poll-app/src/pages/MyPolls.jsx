import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserContext } from '../../context';
import config from '../config';

// https://react-icons.github.io/react-icons/icons/fa/
import { FaPlus, FaRedo, FaAngleUp, FaAngleDown } from 'react-icons/fa';

function MyPolls() {
    const [polls, setPolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { identifier } = useUserContext();

    // Table column names
    const dateCol = "date_created"
    const tableCols = ["question", dateCol, "available", "responses"];

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

    // Link to poll details, ignore clicks on checkbox
    function handleRowClick(e, shortId) {
        if (e.target.tagName.toLowerCase() != 'input') {
          navigate(`/poll/${shortId}`);  
        }        
    }

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

    // Toggle poll availability
    async function toggleAvailable(poll) {
        console.log(`${config.BACKEND_BASE_URL}/api/poll/${poll.available? 'close' : 'open'}/${poll._id}`);
        fetch(`${config.BACKEND_BASE_URL}/api/poll/${poll.available? 'close' : 'open'}/${poll._id}`, {
            method: "PATCH",    
            credentials: config.API_REQUEST_CREDENTIALS_SETTING
        })
        .then(res => {
            if (res.status == 401) {
                navigate('/login');
                throw new Error(res.statusText)
            }
        })
        .then(() => fetchPolls(identifier))
        .catch(error => console.log(error))
    }

    async function fetchPolls(identifier) {
        setIsLoading(true);
        fetch(`${config.BACKEND_BASE_URL}/api/user/created_polls/${identifier}`, { 
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
            console.log("refreshed polls")
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
                    </tr>
                </thead>
                {isLoading? <h2>Loading...</h2> :
                polls.length == 0? <h2>You haven't created any polls</h2> :
                <tbody>
                    {polls.map(poll => {
                        return <tr onClick={(e) => handleRowClick(e, poll.shortId)} key={poll._id}>
                            <td>{poll.question}</td>
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
                            <td><input type='checkbox' onClick={() => toggleAvailable(poll)} defaultChecked={poll.available}></input></td>
                            <td>{poll.responses.length}</td>
                        </tr>
                    })}
                </tbody>}
            </table>
            </>
        </Page>
    );
}

export default MyPolls;