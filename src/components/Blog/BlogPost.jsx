import React from 'react';
import '../Blog/Blog.css';
import { Link } from 'react-router-dom';
import Blog1 from '../../Assets/blog/blog1.jpg';
import Blog2 from '../../Assets/blog/blog2.jpg';
import Blog3 from '../../Assets/blog/blog3.jpg';
import Blog4 from '../../Assets/blog/blog4.jpg';
import Blog5 from '../../Assets/blog/blog5.jpg';
import Blog6 from '../../Assets/blog/blog6.jpg';

const BlogPost = () => {

    const articles = [
        {
          id:1,
          title: "The three levels of audits: This guide reveals which you need",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "So, you’ve made the commendable decision to start an independent audit on your business. This should be a simple process that puts you in an incredibly advantageous position.",
          image: Blog1
        },
        {
            id:2,
          title: "Why would you need an independent audit? What can you get out it?",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Business owners typically aren’t thrilled to be audited. But, genuinely, audits can be a welcomed, useful tool that establishes confidence in your business — from you,",
          image: Blog2
        },
        {
            id:3,
          title: "Your guide to optimizing charitable donations with Canadian tax credits",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Did you know that the average age of Canadian donors hovers around 55? And while people 24 and under are donating an average of $400 a year, those approaching retirement are giving away $3,300.",
          image: Blog3
        },
        {
         id:4,
          title: "How to: Deduct charitable donations from your Brampton small business",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Did you know that nearly a quarter of Canadians donated to charity because of the tax credit? As much as you believe in a movement, care about your community, and fight for those in need, you’re still reading this article about saving on taxes ",
          image: Blog4
        },

        {
            id:5,
          title: "Create a small business financial plan by starting here",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog5
        },
        {
         id:6,
          title: "How Do CRA Audits Work? What Do You Need To Prepare?",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog6
        }
        
      ];

  return (
    <>
    <div className="container my-5">
      <div className="row">

        {articles.map((article, index) => (
          <div className="col-md-6 mb-4" key={index} data-aos="flip-up" >
            <div className="card">
              <img src={article.image} className="card-img-top" alt={article.title} />
              <div className="card-body">
                <h5 className="card-title">{article.title}</h5>
                <p className="card-text text-muted">{article.date} {article.comments}</p>
                <p className="card-text">{article.description}</p>
                <Link to={`/blogdetails/${article.id}` }className="btn btn-link">
                Read More »
                </Link>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
    </>
  )
}

export default BlogPost;