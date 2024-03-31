import { useState } from 'react';
import { useUserContext } from '../../context';
import Alert from './alert';
import Header from './header'

function Page({ children, title, centerTitle, hideNav }) {
    const { alert, setAlert } = useUserContext();
    const titleClass = 'title' + (centerTitle? ' center' : '')

    return (
        <>
            {hideNav? <></> : <Header hideNav={hideNav}></Header>}
            {alert != null && <Alert {...alert} />}
            <div className='content'>
                <h1 className={titleClass}>{ title }</h1>
                { children }
            </div>
        </>
    );
}

export default Page;