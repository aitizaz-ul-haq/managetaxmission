'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubmissionForm from '../../../../components/company/SubmissionForm';

export default function NewSubmissionPage() {
  const router = useRouter();
  const [savedId, setSavedId] = useState(null);

  function handleSaved(submission) {
    if (submission?._id && !savedId) {
      setSavedId(submission._id);
      // Replace URL without full reload so form state is kept
      window.history.replaceState(null, '', `/company/submissions/${submission._id}`);
    }
  }

  return (
    <div className="page-content">

        <div className="page-header">
          <h1 className="page-title">Create New Submission</h1>
        </div>
        <SubmissionForm submissionId={savedId} onSaved={handleSaved} />
      </div>
  );
}
