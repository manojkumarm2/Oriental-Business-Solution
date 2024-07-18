import React, { useRef, useState } from "react";
import "./Ftcf.css";
import { Link } from "react-router-dom";
import Navbar from "../commen/Navbar";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import Footer from "../commen/Footer";
import emailjs from "emailjs-com";
import { toast } from "react-toastify";
import { AppConfig } from '../../config/app.config'

const Ftcf = () => {
  const formRef = useRef();
  // const [fileData, setFileData] = useState([]);
  const [name, setName] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateForm = (formValues) => {
    const errors = {};
    for (const [key, value] of Object.entries(formValues)) {
      if (key === 'name') setName(value);
      if (key !== 'attachment' && value?.trim() === '') {
        errors[key] = `${key} is required`;
      }
    }
    return errors;
  };

  // const handleFileChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   const promises = files.map((file) => {
  //     return new Promise((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.onloadend = () => {
  //         resolve({
  //           name: file.name,
  //           type: file.type,
  //           data: reader.result.split(',')[1]
  //         });
  //       };
  //       reader.onerror = reject;
  //       reader.readAsDataURL(file);
  //     });
  //   });

  //   Promise.all(promises).then((attachments) => {
  //     setFileData(attachments);
  //   }).catch((error) => {
  //     console.error('File reading error:', error);
  //   });
  // };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(formRef.current);
    const formValues = Object.fromEntries(formData.entries());
    let formValid = true;
    const errors = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      formValid = false;
    }

    //   const params = {
    //     ...formValues,
    //     attachments: fileData
    // };

    if (formValid) {
      const emailConfig = AppConfig.email;
      const { service, ftcf_template, publicKey } = emailConfig;
      emailjs
        .sendForm(
          service,
          ftcf_template,
          formRef.current,
          publicKey
        )
        .then(
          (result) => {
            console.log(result.text);
            toast.success("Form sent successfully!");
            setFormSubmitted(true);
            formRef.current.reset();
          },
          (error) => {
            console.log(error.text);
            toast.error("Failed to send the Form, please try again.");
          }
        );
    } else {
      toast.warn("Please fill in all fields.");
    }
  };

  return (
    <>
      <div className="service_container">
        <div className="service_bg">
          <Navbar />
          <div className="service_head_container">
            <div className="d-flex">
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <FaHome
                    style={{
                      fontSize: "20px",
                      margin: "0 13px",
                    }}
                  />
                  <h6
                    style={{
                      margin: "0 6px",
                    }}
                  >
                    HOME
                  </h6>
                </div>
              </Link>
              <Link
                to="/ftcf"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{
                      fontSize: "18px",
                      margin: "0 13px",
                    }}
                  />
                  <h6>FREE TAX CLINIC FORM</h6>
                </div>
              </Link>
            </div>
            <h1>Free tax clinic form</h1>
          </div>
        </div>
      </div>

      <div className=" py-5 form-container container d-flex flex-column" style={{ width: "60%" }}>
        {/* <h4 className="text-align-center">FREE TAX CLINIC FORM</h4> */}
        {!formSubmitted ? (
          <form ref={formRef} className="d-flex flex-column justify-content-center" style={{ fontSize: '20px' }} onSubmit={handleSubmit}>
            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Name
              </label>
              <input name="name" type="text" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                (as Per CRA / service canada)
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Email
              </label>
              <input name="email" type="email" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                {/* (We'll never share your email with anyone else) */}
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                DOB
              </label>
              <input name="dob" type="text" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                (DD/MM/YYYY).
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Marital Status
              </label>
              <input name="marital-status" type="text" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                (Submit seperate form for spouse)
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Date of Entry to Canada
              </label>
              <input name="doe" type="text" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                (DD/MM/YYYY)
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Status in Canada
              </label>
              <input name="status" type="text" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                (WP/PR/Citizenship)
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Address
              </label>
              <input name="address" type="text" className="form-control" required
              />
              <div id="emailHelp" className="form-text">
                (Street no & name, city, portal code)
              </div>
            </div>

            <div className="mb-3">
              <label for="exampleInputEmail1" className="form-label">
                Phone
              </label>
              <input name="pnumber" type="number" className="form-control" required
              />
            </div>

            <div class="mb-3">
              <label for="exampleFormControlTextarea1" class="form-label">
                Medical Expenses
              </label>
              <textarea
                class="form-control"
                id="exampleFormControlTextarea1"
                rows="5"
                name="medical-expense"
                value="NA"
              ></textarea>
              <div id="emailHelp" className="form-text">
                (Yearly with date, clinic/doctor name and address)
              </div>
            </div>

            <div class="mb-3">
              <label for="exampleFormControlTextarea1" class="form-label">
                Children Details
              </label>
              <textarea
                class="form-control"
                id="exampleFormControlTextarea1"
                rows="5"
                name="child"
                value="NA"
              ></textarea>
              <div id="emailHelp" className="form-text">
                (Fullname, DoB, SIN if possible)
              </div>
            </div>

            {/* <div class="mb-3">
            <label for="formFileMultiple" class="form-label">
              Attach T4/T5007
            </label>
            <input
              class="form-control"
              type="file"
              id="formFileMultiple"
              multiple
              name="attachment"
              onChange={handleFileChange}
            />
          </div> */}

            <div class="mb-3">
              <label for="exampleFormControlTextarea1" class="form-label">
                Other Notes
              </label>
              <textarea
                class="form-control"
                id="exampleFormControlTextarea1"
                rows="5"
                name="notes"
                value="NA"
              ></textarea>
              <div id="emailHelp" className="form-text">
                (Include tax year from 2013 onwords)
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Send Form
            </button>
          </form>
        ) : (
          <div id="successMessage" class="success-message" tabindex="0">
          <p><b>Form sent successfully!</b></p>
          <p>If you wish to share the attachments, you can email them directly to: 
              <a href={`mailto:ashok@orientalbusinesssolutions.com?subject=Attachments for: ${name}&body=Here are the attachments: `}>
                admin@orientalbusinesssolutions.com
              </a>
            </p>
            <p><b>Required Docs:</b></p>
            <p>T4</p>
            <p>T4A</p>
            <p>T5007</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Ftcf;
