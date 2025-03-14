import React from 'react';
import { FaRegCopyright } from "react-icons/fa6";

const CopyRights = () => {
    return (
        <>
            <div
                style={{
                    background: "#021137",
                    color: "#fff",
                    width: "100%"
                }}
            >
                <div className="container-lg">
                    <div className="row p-4 m-0">
                        <div className="col-md-12 text-center" >
                            <FaRegCopyright /><span className='ps-2'>2025 Oriental Business Solutions Inc. Developed by Magizhini Technology Services Inc. All rights reserved.</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CopyRights;