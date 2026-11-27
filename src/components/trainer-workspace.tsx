"use client";
import {useState} from 'react';
import {members} from '@/lib/model';
import type {ScreenProps} from './journal-app';
import {PageHeading} from './ui';
import {NutritionPlanEditor,CoachingThread} from './member-studio';
export default function TrainerWorkspace({mode,...props}:ScreenProps&{mode:'nutrition'|'feedback'}){const[selected,setSelected]=useState('alex');const member=members.find(m=>m.id===selected)!;const name=selected==='alex'?props.data.profile.Name||member.name:member.name;return <div className="studio-flows"><PageHeading title={mode==='nutrition'?'Nutrition, with intention.':'Keep the conversation going.'} description="Coach plans and feedback stay linked to each member in this session."/><section className="workflow-card"><label>Choose member<select aria-label="Choose member" value={selected} onChange={e=>setSelected(e.target.value)}>{members.map(m=><option key={m.id} value={m.id}>{m.id==='alex'?props.data.profile.Name||m.name:m.name}</option>)}</select></label></section>{mode==='nutrition'?<NutritionPlanEditor key={selected} {...props} memberId={selected} memberName={name}/>:<CoachingThread key={selected} {...props} memberId={selected} memberName={name} trainer/>}</div>;}
