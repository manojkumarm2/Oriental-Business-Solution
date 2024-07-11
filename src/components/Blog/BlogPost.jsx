import React from 'react'
import '../Blog/Blog.css'
import { Link } from 'react-router-dom';
import Blog2 from '../../Assets/blog/blog-2.jpg'
import Blog3 from '../../Assets/blog/blog-3.jpg'
import Blog4 from '../../Assets/blog/blog-4.jpg'
import Blog5 from '../../Assets/blog/blog-5.jpg'

const BlogPost = () => {

    const articles = [
        {
          id:1,
          title: "Quis pellentesque sed penatibus eges",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog2
        },
        {
            id:2,
          title: "Aenean harerta placerat adipiscing",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog3
        },
      ];

      const articles_2=[
        {
            id:3,
          title: "Aenean harerta placerat adipiscing",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog4
        },
        {
         id:4,
          title: "Aenean harerta placerat adipiscing",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog5
        },
      ];

      const articles_3=[
        {
            id:5,
          title: "Aenean harerta placerat adipiscing",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog2
        },
        {
         id:6,
          title: "Aenean harerta placerat adipiscing",
          date: "October 21, 2021",
          comments: "No Comments",
          description: "Aenean harerta quam placerat adipiscing penatibus adipiscing gravida elementum aliquet eget senectus felis enim diam.",
          image: Blog3
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
                <Link to='/' className="btn btn-link">
                Read More »
                </Link>
              </div>
            </div>
          </div>
        ))}

{articles_2.map((article, index) => (
          <div className="col-md-6 mb-4" key={index} data-aos="flip-up">
            <div className="card">
              <img src={article.image} className="card-img-top" alt={article.title} />
              <div className="card-body">
                <h5 className="card-title">{article.title}</h5>
                <p className="card-text text-muted">{article.date} {article.comments}</p>
                <p className="card-text">{article.description}</p>
                <Link to='/' className="btn btn-link">
                Read More »
                </Link>
              </div>
            </div>
          </div>
        ))}

{articles_3.map((article, index) => (
          <div className="col-md-6 mb-4" key={index} data-aos="flip-up">
            <div className="card">
              <img src={article.image} className="card-img-top" alt={article.title} />
              <div className="card-body">
                <h5 className="card-title">{article.title}</h5>
                <p className="card-text text-muted">{article.date} {article.comments}</p>
                <p className="card-text">{article.description}</p>
                <Link to='/' className="btn btn-link">
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

export default BlogPost