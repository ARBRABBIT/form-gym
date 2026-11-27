"use client";
export default function AppError({retry}:{error:unknown;retry:()=>void}){return <div className="studio-flows workflow-loading" role="alert"><span className="workflow-wordmark">form.</span><h1>Let’s try that again.</h1><p>This screen couldn’t load. You can retry without leaving the app.</p><button className="workflow-primary" onClick={retry}>Try again</button></div>;}
