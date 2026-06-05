import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getApiUrl } from "../authConfig";
import Navbar from "../components/Common/Navbar";
import Footer from "../components/Common/Footer";
import FaxForm from "../components/Common/FaxForm";

const PublicSendFaxPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [initialSenderEmail, setInitialSenderEmail] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/public/fax/validate/${token}`));
        const data = await response.json();
        
        if (response.ok && data.status === "Pending") {
          setInitialSenderEmail(data.email || "");
        } else {
          setTokenError(data.error || "This secure link is invalid or has expired.");
        }
      } catch (err) {
        setTokenError("Failed to connect to the server to validate the token.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSubmit = async (formData, resetForm) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(getApiUrl(`/api/public/send-fax/${token}`), {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.error || "Failed to send fax.");
      }
      
      resetForm();
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="container py-5 text-center">Validating secure link...</div>;
    }

    if (tokenError) {
      return (
        <div className="container py-5 text-center">
          <div className="alert alert-danger" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h4>Access Denied</h4>
            <p>{tokenError}</p>
          </div>
        </div>
      );
    }

    if (success) {
      return (
        <div className="container py-5 text-center">
          <div className="alert alert-success" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
            <h2>✅ Fax Sent Successfully</h2>
            <p>Your fax has been successfully submitted and queued for delivery!</p>
            <p className="text-muted mt-3">You may now safely close this window.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-secondary text-white p-3 p-md-4">
                <h4 className="mb-0">Secure Fax Submission</h4>
                <p className="mb-0 opacity-75">Send documents securely to the specified fax number</p>
              </div>
              
              <div className="card-body p-4 p-md-5 bg-white">
                {submitError && (
                  <div className="alert alert-danger mb-4">
                    {submitError}
                  </div>
                )}
                
                <FaxForm 
                  onSubmit={handleSubmit}
                  initialSenderEmail={initialSenderEmail}
                  initialSenderName=""
                  loading={isSubmitting}
                  errorCallback={setSubmitError}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ height: "130px" }}>
        <Navbar />
      </div>
      
      <div className="container pb-2 pt-4">
        <h2 className="fw-bold" style={{ color: "#1A1A4B", marginBottom: "0", textAlign: "center"}}>Public Fax Portal</h2>
      </div>
      
      {renderContent()}

      <Footer />
    </div>
  );
};

export default PublicSendFaxPage;