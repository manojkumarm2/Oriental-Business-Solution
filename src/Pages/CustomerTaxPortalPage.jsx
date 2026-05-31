import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getApiUrl } from "../authConfig";
import Navbar from "../components/Common/Navbar";
import Footer from "../components/Common/Footer";

const CustomerTaxPortalPage = () => {
  const { token } = useParams();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [agreedToFile, setAgreedToFile] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/public/review-tax/${token}`));
        if (!response.ok) {
          throw new Error("This document link is invalid or has expired.");
        }
        const data = await response.json();
        setDocumentData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDocument();
    }
  }, [token]);

  const handleSubmitSignature = async () => {
    if (!signatureName.trim() || !locationStr.trim() || !agreedToFile) {
      alert("Please fill out your name, location, and agree to the filing to provide consent.");
      return;
    }

    try {
      setLoading(true);

      // Capture telemetry data for audit trail
      let publicIp = "Unknown";
      let resolvedLocation = "Unknown";
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          publicIp = geoData.ip || "Unknown";
          resolvedLocation = [geoData.city, geoData.region, geoData.country_name].filter(Boolean).join(", ");
        }
      } catch (e) {
        console.warn("Could not fetch IP geolocation telemetry", e);
      }

      const response = await fetch(getApiUrl(`/api/public/review-tax/${token}/sign`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          typed_name: signatureName,
          location: locationStr,
          agreed_to_file: agreedToFile,
          consent_timestamp: new Date().toLocaleString("en-US", { timeZoneName: "short" }),
          public_ip: publicIp,
          resolved_location: resolvedLocation,
          device_platform: navigator.platform,
          browser_engine: navigator.userAgent
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit signature.");
      }
      
      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && !documentData) {
      return <div className="container py-5 text-center">Loading secure document...</div>;
    }

    if (error) {
      return (
        <div className="container py-5 text-center">
          <div className="alert alert-danger" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h4>Access Denied</h4>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (success) {
      return (
        <div className="container py-5 text-center">
          <div className="alert alert-success" style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
            <h2>✅ Document Signed</h2>
            <p>Thank you. Your tax return authorization has been recorded securely.</p>
            <p className="text-muted mt-3">You may now safely close this window.</p>
          </div>
        </div>
      );
    }

    // Strip out the file extension (e.g., .pdf, .xlsx) for a clean display title
    const displayFileName = documentData.file_name ? documentData.file_name.replace(/\.[^/.]+$/, "") : `${documentData.tax_year} ${documentData.tax_type} Tax Return`;

    // Enforce no-download and no-print parameters directly on the preview URL
    let securePreviewUrl = documentData.preview_url;
    try {
      const urlObj = new URL(securePreviewUrl);
      urlObj.searchParams.set("wdDownloadButton", "False");
      urlObj.searchParams.set("wdPrintButton", "False");
      securePreviewUrl = urlObj.toString();
    } catch (e) {}

    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-secondary text-white p-3 p-md-4">
                <h4 className="mb-0">Tax Return Authorization</h4>
                <p className="mb-0 opacity-75">Review and sign {displayFileName}</p>
              </div>
              
              <div className="card-body p-0 bg-light">
                {/* Primary Document Action for strict browsers */}
                <div className="p-4 p-md-5 text-center border-bottom bg-white">
                  <h5 className="mb-3">Document Ready for Review</h5>
                  <p className="text-muted mb-4" style={{ fontSize: "15px" }}>
                    Please click the button below to securely open your tax return draft in a new tab. 
                    Once you have reviewed the document, return to this page to authorize your filing.
                  </p>
                  <a href={securePreviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg px-4 shadow-sm fw-bold w-100 d-md-inline-block" style={{ maxWidth: '100%' }}>
                    📄 Open & Review Document
                  </a>
                </div>
              </div>

              {documentData.status === "eSigned" || documentData.status === "Signed" ? (
                <div className="card-footer bg-white p-3 p-md-4 text-center">
                  <h5 className="text-success mb-0">✅ This document has already been signed.</h5>
                </div>
              ) : (
                <div className="card-footer bg-white p-3 p-md-4">
                  <h5 className="mb-3">Authorization & Consent</h5>
                  <p className="text-muted small mb-4">By completing the fields below, I certify that I have reviewed the tax return information and authorize the filing of this return.</p>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Type Your Full Name</label>
                      <input type="text" className="form-control" placeholder="e.g. John Doe" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Location (City, Province)</label>
                      <input type="text" className="form-control" placeholder="e.g. Toronto, ON" value={locationStr} onChange={(e) => setLocationStr(e.target.value)} />
                    </div>
                    <div className="col-md-12 mt-2">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="agreeCheck" checked={agreedToFile} onChange={(e) => setAgreedToFile(e.target.checked)} style={{ transform: "scale(1.2)", marginTop: "6px" }} />
                        <label className="form-check-label fw-bold ms-2" htmlFor="agreeCheck" style={{ fontSize: "14px" }}>
                          I have reviewed the draft return and agree to proceed with the filing.
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4"><button className="btn btn-success btn-lg px-4 shadow-sm w-100 d-md-inline-block" style={{ maxWidth: '100%' }} onClick={handleSubmitSignature} disabled={loading || !signatureName.trim() || !locationStr.trim() || !agreedToFile}>{loading ? "Submitting..." : "Sign & Complete"}</button></div>
                </div>
              )}
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
        <h2 className="fw-bold" style={{ color: "#1A1A4B", marginBottom: "0", textAlign: "center"}}>Document Signature</h2>
      </div>
      
      {renderContent()}

      <Footer />
    </div>
  );
};
export default CustomerTaxPortalPage;
