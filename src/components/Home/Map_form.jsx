import React from "react";
const Map_form = () => {
  return (
    <>
      <div className="map_form">
        <div>
          <div className="contact-container d-flex justify-content-around  py-4 my-4 ">
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2889.4471835333743!2d-79.63857822240347!3d43.59722987110489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b473b287e3351%3A0xc4338c578acef23e!2sMississauga%20Tax%20Consulting%20-%20International%20Tax%20-%20US%20Tax%20-%20Corporate%20Tax%20-%20Personal%20Tax!5e0!3m2!1sen!2sca!4v1720753694958!5m2!1sen!2sca"
              style={{border:'0', width:'700px', height:'540px'}}
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            

            <div className="contact-form" style={{
              background:'#fff',
              boxShadow:'0 4px 8px rgba(0, 0, 0, 0.1)'

              }}>
              <h2>Send A Message</h2>
              <p>
                Use our contact form below to get started on optimizing your
                financial strategy with confidence.
              </p>
              <form action="#" method="post">
                <input type="text" name="name" placeholder="Name" required />
                <input type="email" name="email" placeholder="Email" required />
                <textarea
                  name="message"
                  placeholder="Message"
                  required
                ></textarea>
                <button type="submit">Send Message</button>
              </form>
            </div>
          </div>
          {/* <div className="map-container">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62864.15576602335!2d77.42217152815937!3d10.016053938046772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b071353e94a7877%3A0x962bf8fd53981722!2sTheni%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1720262871861!5m2!1sen!2sin"
                        width="100%"
                        height="450"
                        allowFullScreen=""
                        loading="lazy"
                        style={{ border: 0 }}
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Map"
                    ></iframe>
                </div> */}
        </div>
      </div>
    </>
  );
};

export default Map_form;
