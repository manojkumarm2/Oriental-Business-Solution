import React from "react";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import "./BlogDetail.css";
import Footer from "../commen/Footer";

const BlogDetails = () => {
  const blogcard = [
    {
      id: 1,
      title: "The three levels of audits: This guide reveals which you need",
      heading: "Figuring out the audit service you need",
      des1: "Do you need an audit, a review, or a compilation? Professional organizations classNameify them as distinct services. Each option differs in thoroughness and has a different ideal use case, from securing a small loan to selling your business.",
      sub_head1: "Compilations",
      des2: "Request a compilation when third parties, like lenders and stakeholders, would appreciate your business being verified by a CPA, but don’t have a specific interest in financial statements. In a compilation, a CPA reads the financial statements to assess the diligence of your reporting. However, they won’t review the financial statements for pinpoint accuracy. The CPA also won’t give their professional advice or their assurance that the financial statements are faultless. This basic level of third-party analysis can be good enough for vendors to give you a small loan, credit, or other financings, especially if you grant collateral.",
      sub_head2: "Reviews",
      des3: "Ask for a review when you need to provide a basic level of assurance that your financial statements are errorless. In a review, a CPA inquires and analyzes your financial statements in order to give third parties the comfort of knowing an assessment took place. The CPA will write a formal conclusion on whether your statements fit the financial reporting framework and whether changes should be made in pursuit of that standard. This gives you peace of mind since, if your financial statements are found sub-par, you’ll also receive a report explaining what changes should be made. Results from a review are usually good enough to land complex financing and credit agreements, even without collateral.",
      sub_head3: "Audits",
      des4: "The results of an audit provide the highest guarantee that your financial statements are accurate.A CPA will review the numbers in your financial statement and collect first-hand evidence via inquiries, inspections, observation, cross-checking with sources, analysis, and more. To go even deeper, they will thoroughly learn how your business’s internal controls work and then determine the risk of fraud.To conclude, the CPA will write a report on whether your financial statements were prepared correctly and accurately.You need an audit when you’re selling your business or pursuing high-level financing.Once you’ve determined the level of service you need, the next step is planning for it and setting a launch date. The next part of this guide will tackle exactly when to start your independent audit, and how to get ready for it.",
    },
    {
      id: 2,
      title:
        "Why would you need an independent audit? What can you get out it?",
      heading: "What exactly is an independent audit?",
      des1: "An independent audit means getting a third party to scrutinize your business’s financial records and reporting policies, to ensure their integrity. This third party, called an auditor, is typically a Chartered Professional Accountant (CPA) or a public accounting firm.The auditor will check your business’s financial documents, analyze your operations and policies, evaluate your assets, determine your tax liability, and confirm your compliance with laws.Shareholders, investors, and vendors are keenly interested in audits because they expose fraudulent practices or misleading financial claims. If the audit results come back clean, people put more trust in the business. Furthermore, the very concept of audits keeps business owners on their best behaviour.",
      sub_head1: "Why can’t you audit yourself or task your in-house accountant?",
      des2: "While you should certainly build the habit of examining your financial records, audits are more formal, and the results are used as objective proof. Hence, it would be a conflict of interest for you or your staff to audit your own business, as there would be bias and a motive to alter the results — which is less trustworthy from an outside perspective.",
      sub_head2: "The biggest reasons you need an independent audit",
      des3: "Unlike a CRA audit, you’ll make the choice to start an independent audit because you’ll benefit from it.To raise capital or sell your business, use internal audit results to give potential buyers and investors the full rundown of your business in an objective and unbiased format. This is super impactful for gaining trust that eventually leads to closing a deal.To leverage supplier relationships (aiming to place larger orders, increase your trade credits, etc.), use internal audit results to confidently display that your business is in a great state to honor the mutually beneficial arrangement.To meet lender/investor requirements, use internal audit results to expedite their vetting processes by providing info that has already been verified by a reputable third partyTo gain the trust of your audience and potential clients, complete and internal audit in order to assure people your business has been thoroughly reviewed and declared up to par.To go public with stock for your business, you’ll need at least three years of audited financial statements.Then, tip the scales in your favour by preparing for and initiating the independent audit — you’ll learn exactly how in the next guide.",
      sub_head3: "",
      des4: "",
    },
    {
      id: 3,
      title:
        "Your guide to optimizing charitable donations with Canadian tax credits",
      heading: "Claiming donations from past years",
      des1: "When you make a donation, you have up to 4 years to claim the tax credits. Plus, excess donations can be deferred to next year, within 5 years. This opens up a strategy that people use to get more tax credits.Note that donating up to $200 yields a 15% tax credit and higher contributions yield 29%. If you have under $200 worth of donations this year, you can combine it with past or future years until the total surpasses $200.The easiest way to keep track of your past donations — claimed and unclaimed — is to visit the CRA My Account website and log in. Look at the top of the page; you’ll see a tax returns tab. From there, you can look at your filings from prior years. If you’re looking into a year pre-2019, check your T1 form, specifically line 349. If it’s a filing from 2019 or later, check your Income and Tax Benefit returns, line 349000.",
      sub_head1: "Claiming donations as a couple",
      des2: "If you have a spouse via marriage or common-law, you can pool your donations and claim the total. You can transfer a portion or the entirety of your donations to your partner. This opens up a strategy to gain more tax deductions for each person.Imagine you donated $200. Your partner also donated $200. Well, 15% of $200 is $30. You’ll each save $30 on the tax you owe. That’s $60 in total savings.Alternatively, you pool the donations and claim $400. The first $200 of it garners a 15% credit, which is $30. The excess $200 garners a 29% credit, which is $58. In total, you save $88 worth of taxes, which is roughly 50% higher than if you claimed donations individually.That’s not all. This strategy also helps maximize provincial tax credits, which you’ll discover now.",
      sub_head2: "Provincial charitable tax credits",
      des3: "Every Canadian taxpayer can access federal charitable donation tax credits, but there’s another layer. Every province has a charitable donation tax credits incentive of its own.Ontario’s rate is 20.05% for donations under $200 and 40.16% for donations over $200, increased to 44.16% for people in the top income bracket (over $235,675).Ontario (along with Nunavut) has the lowest charitable tax credit rates among Canadian provinces. In contrast, the highest overall rates are in Alberta: 75% for donations under $200 and 54% for higher donations from top earners. Regardless of where the grass may be greener, tax credits will save you money.The provincial incentive will trigger on top of your federal incentive. When you’re doing your taxes, obtain provincial Form 428 and fill out Line 58969.",
      sub_head3: "",
      des4: "",
    },
    {
      id: 4,
      title:
        "RRSP Vs TFSA: The Differences, And Exactly How To Choose",
      heading: "How Do TFSAs Work?",
      des1: "Any Canadian resident who is 18 or older may open a TFSA (tax-free savings account) and use it for simple savings or to hold investments. Most commonly it holds bonds, stocks, cash, guaranteed investment certificates (GICs), and exchange-traded funds (ETFs).Taxes are not applied to any earnings made in the account, even when you make a withdrawal. This includes any interest, stock dividends, and capital gains made in your TFSA — it’s all tax-free.But unlike RRSP payments, TFSA donations won’t lower your taxable income.There is an annual cap on the amount of money you can put into your TFSA. The unused contribution room can be carried over to the current lifetime maximum amount, though. You have an allowance of about $6,000 available for your TFSA each year, so you can contribute that sum, plus extra if you have any rollover from prior years.Note that any profits you realize from those assets won’t reduce your ability to make contributions this year or in the future. In essence, you don’t pay taxes on the income you receive within your TFSA.So how does a TFSA avoid taxes? Since you contribute to a TFSA from your net income, the money you deposit into it has already been subject to tax. Therefore there is no tax advantage at the time of contribution. You just won’t be taxed again when you make a withdrawal.",
      sub_head1: "How Do RRSPs Work?",
      des2: "A registered retirement savings plan, known as an RRSP, will hold both savings and investments. This account offers you the opportunity to make big annual contributions — the real benefit is that, according to how much you donate, it lowers your taxable income. An RRSP helps you postpone taxes while putting money away for retirement.It’s vital to keep in mind that whenever you withdraw this money, you will owe tax on it. When you turn 71, you must turn your RRSP into a registered retirement income fund (RRIF) that you can withdraw from, since you can no longer make contributions to it. You’ll start paying tax on the money you contributed.The premise is that since you invested in an RRSP, you pay less tax overall — because you’re paying as a retiree, in a lower tax bracket, as opposed to paying tax during your high-earning years where more tax is expected of you.",
      sub_head2: "How The TFSA Vs. RRSP Choice Will Affect You",
      des3: "Your most effective investment will hinge on your unique financial circumstances and priorities. Remember: With an RRSP, you receive a tax refund now on the money you contribute, but will have to pay tax later when you use it as income. In contrast, with a TFSA, you pay tax on money you’ve earned before you make a contribution.Consider your current earning potential, what you expect to earn in the future, your schedule for investing, and whether you anticipate tapping into savings sooner or later. You might even discover that you can capitalize on both accounts at once. So, which should you invest in more, your TFSA or your RRSP? Here’s some preliminary advice based on your stage of life.",
      sub_head3: "Modest Income",
      des4: "Saving in a TFSA is preferable to saving in an RRSP if you are in a lower-income tax bracket (for instance, if you’re on maternity leave or pursuing education). At the lower end of the income spectrum, the tax benefits of RRSPs are less significant, especially compared to the opportunity to grow your savings in a TFSA.",
      sub_head4: "Middle className",
      des5: "There might not be a definite benefit to adopting one plan over the other if you fall into the intermediate income tax bracket. One tactic is to make TFSA contributions now and build up RRSP space for use later if you anticipate being in a higher tax bracket where you can take full use of the tax benefits.",
      sub_head5: "High Income",
      des6: "When your tax bracket is high, use both accounts. If you have to pick one: If your current tax rate is greater than you anticipate it to be when you withdraw your investments, an RRSP is a wise choice. As a bonus, you can source your TFSA contributions from the refund from your RRSP contribution.",
    },
    {
      id: 5,
      title: "Here’s The Easiest Way To Track Receipts For Your Business",
      heading: "Your Way Of Tracking Is Unique",
      des1: "Maybe you’re not one of a kind, but it’s safe to say you have preferences. Thankfully, you also have options. There are several different ways you can do this. You could use a simple spreadsheet and enter in all the details for each purchase or set up a special system that automatically records information into an organized folder. If you’re dealing with physical paper receipts, make sure to store them away from any other documents to avoid confusion.The simplest way to keep track of receipts is to store them in an envelope or folder at home so that they don’t get lost. However, if you want to be more organized about your finances, there are several options available for recording receipts electronically. This allows for better organization, faster retrieval, and better tracking of expenses.",
      sub_head1: "Finding A Software To Use",
      des2: "There are many apps and websites specifically designed for tracking and managing business expenses. Some will allow you to upload scanned copies of your receipts, as well as access detailed summaries of your spending habits over time. This is especially useful if you frequently travel for business; you can easily keep track of all your expenses with the tap of a button.",
      sub_head2: "Organization Will Save You Time And Legal Trouble",
      des3: "It’s important to stay organized and keep track of receipts as soon as possible, instead of waiting until tax season rolls around. Having all of your information in one place makes it easier to manage and audit expenses. Additionally, if you need to dispute a purchase at any point, having a record on hand can come in handy.Staying organized and recording every receipt can help you save money, avoid financial issues down the road, and be prepared for whatever comes your way — both now and in the future! Regularly tracking your spending will also give you valuable insights into how much you are spending each month and where that money goes.",
      sub_head3: "",
      des4: "",
    },
    {
      id: 6,
      title: "How Do CRA Audits Work? What Do You Need To Prepare?",
      heading: "How A CRA Audit Works",
      des1: "During a tax audit, the Canada Revenue Agency (CRA) meticulously scrutinizes a taxpayer’s documents and financial records to verify their adherence to tax regulations, accurate tax reporting, and receipt of eligible benefits and refunds.An appointed CRA auditor initiates the audit process by contacting you through mail, telephone, or both. They will specify the audit’s date, time, and location.Typically, an in-person audit is conducted at your residence, place of business, or the office of your designated representative. The auditor will equip you with a valid identification card upon arrival before commencing the audit. On-site audits offer the advantage of addressing queries promptly and reducing delays in finalizing the audit.If an on-site audit isn’t feasible, it will be held at a designated CRA office — which might not be the closest one to you. On the bright side, the auditor may let you send your necessary documents instead of making trips to the location.If you’re frustrated gathering all the required documents or dismayed with the process of sending documents back and with your auditor, we can help.",
      sub_head1: "Getting Audited By The CRA: Frequently Asked Question",
      des2: "",
      sub_head2: "Can The CRA Audit Your Bank Account?",
      des3: "Yes, the CRA can look at your bank account and statements. The CRA checks everyone’s details, whether the person runs a business or not. This can even include checking your spouse’s or family’s accounts and looking at credit card bills, electricity bills, and other financial records.However, the CRA can’t just peek whenever it wants. Officials need a good reason, and usually, their reason is based on the info you give them.",
      sub_head3: "",
      des4: "",

    },
  ];

  const { id } = useParams();
  const blogcards = blogcard.find((card) => card.id === parseInt(id));
  //   const { title } = blogcards;
  return (
    <>
      <div className="serviceDetail_container">
        <div className="serviceDetail_bg">
          <div className="blogDetail_head_container d-flex justify-content-center">
            <div className="d-flex">
              <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                <div className="d-flex">
                  <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                  <h6 style={{ margin: "0 6px" }}>HOME</h6>
                </div>
              </Link>
              <Link
                to="/blog"
                style={{ textDecoration: "none", color: "#fff" }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{ fontSize: "18px", margin: "0 13px" }}
                  />
                  <h6>BLOG</h6>
                </div>
              </Link>
              <Link
                to={`/blogdetails/${blogcards.id}`}
                style={{ textDecoration: "none", color: "#fff" }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{ fontSize: "18px", margin: "0 13px" }}
                  />
                  <h6>Blog Details</h6>
                </div>
              </Link>
            </div>
            <h1 className="blog-title">{blogcards.title}</h1>
          </div>
        </div>
      </div>
      <div className="container my-5 blogDetail_container">
        <div className="row">
          <div className="col-12">
            <h1
              className="display-4 my-4 blogdetail_heading"
            >
              {blogcards.heading}
            </h1>
            <p className="blogdetail_para">{blogcards.des1}</p>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <h2 className="my-4">{blogcards.sub_head1}</h2>
            <p >{blogcards.des2}</p>
          </div>
          <div className="col-12">
            <h2 className="my-4">{blogcards.sub_head2}</h2>
            <p >{blogcards.des3}</p>
          </div>
          <div className="col-12">
            <h2 className="my-4">{blogcards.sub_head3}</h2>
            <p >{blogcards.des4}</p>
          </div>
          <div className="col-12">
            <h2 className="my-4">{blogcards.sub_head4}</h2>
            <p >{blogcards.des5}</p>
          </div>
          <div className="col-12">
            <h2 className="my-4">{blogcards.sub_head5}</h2>
            <p >{blogcards.des6}</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogDetails;
