This is for a 24 hour hackathon so we can only do so much.
We are affiliated with AWS for the hackathon so have their resources, as later defined.
One of our group members is using nix, so update shell.nix if you need any new resources.

Project Summary:

AI Study Companion

A modern AI-powered study website designed to feel like studying alongside a knowledgeable classmate.
Users log in and click Start Study Session. Before the session begins, they enter a simple pre-study screen where they can upload their class materials, such as lecture slides, PDFs, notes, or other study documents. The AI uses these materials as context throughout the session so that its answers are grounded in what the student is actually learning in class.
Once the student clicks Start, they enter the main study environment.
Study Experience
The center of the screen features a lo-fi hip-hop study girl animation, similar to the familiar lo-fi study aesthetic. Normally, she quietly studies while background music plays.
When the student speaks to the AI, the character turns toward the student and responds. Her mouth would animate or lip-sync with the generated speech so that it feels as though the character is actually talking to you. When the conversation ends, she turns back toward her desk and continues studying.
The goal is to make the AI feel less like a chatbot and more like the classmate you wish you had while studying — someone who has already read your lecture material, understands the topic, and can explain concepts in simpler terms when you get stuck.
Core Features
Voice conversations: Click the microphone button and ask the AI a question. The AI responds naturally using voice.
Course-aware answers: The AI uses the files uploaded before the session to help answer questions based on the student's actual course material.
Text chat: A chat panel on the side provides another way to communicate with the AI when the student does not want to use voice.
Upload additional material: Students can upload more notes, slides, or documents directly from the chat during a study session.
Lo-fi study environment: The main interface centers around the animated lo-fi study character and creates a relaxed study atmosphere.
Music controls: Simple settings allow students to play, pause, mute, or switch the background study music.
Minimize mode: The study interface can be minimized into a smaller view so the student can continue interacting with the AI while working in another application or browser window.
Study timer: The application tracks how long the student has been studying.
User Flow
1. Log In
The student signs into the website and arrives at a simple dashboard.
2. Start Study Session
The student clicks Start Study Session.
3. Prepare Session
Before entering the session, the student uploads the material they are currently studying:
Lecture slides
PDFs
Class notes
Study guides
Other relevant documents
4. Start Studying
The student enters the main study environment with the lo-fi study character and background music.
From here, they can:
Click the microphone and speak to the AI
Interrupt or ask follow-up questions naturally
Use text chat instead of voice
Upload additional study material
Control the background music
Minimize the study interface while continuing their work
5. End Study Session
When the student finishes studying, they end the session. The application can then provide a simple recap showing:
Study session length
Topics discussed
Key concepts covered
Short AI-generated summary of the session
The AI's Role
The AI should not behave like a formal professor or generic chatbot.
It should behave like a smart classmate studying beside you.
If the student asks:
"I don't understand why Dijkstra's algorithm doesn't work with negative edges."
Instead of giving a long textbook response, the AI might respond conversationally:
"Basically, Dijkstra assumes that once it finds the cheapest path to something, that path won't suddenly get cheaper later. A negative edge can break that assumption."
If the student still does not understand, they can simply say:
"Wait, explain that differently."
The AI can then use another explanation, analogy, or example.
The uploaded course material should remain the AI's primary source of context so its explanations stay relevant to the student's class.
Main Product Goal
The project is intentionally simple.
Rather than building a full learning-management system, customizable AI characters, complicated dashboards, or dozens of study tools, the application focuses on one experience:
Open the site, give it what you're studying, and study alongside an AI classmate who already understands your material.
The lo-fi environment makes studying feel comfortable and familiar, while voice interaction makes asking questions significantly faster and more natural than repeatedly switching to a chatbot and typing prompts.
The result should feel less like using an AI tool and more like having someone there studying with you.

-----------------

Here are the services we have access to:

Amazon Bedrock

Amazon Bedrock 
is a fully managed service that offers a choice of high-performing foundation models (FMs) from leading AI companies like AI21 Labs, Anthropic, Cohere, Meta, Stability AI, and Amazon via a single API, along with a broad set of capabilities you need to build generative AI applications with security, privacy, and responsible AI. Using Amazon Bedrock, you can easily experiment with and evaluate top FMs for your use case, privately customize them with your data using techniques such as fine-tuning and Retrieval Augmented Generation (RAG), and build agents that execute tasks using your enterprise systems and data sources. Since Amazon Bedrock is serverless, you don't have to manage any infrastructure, and you can securely integrate and deploy generative AI capabilities into your applications using the AWS services you are already familiar with.

Important: Only the below models will be available for use in this hackathon.

    All Amazon Models
    Anthropic Claude Sonnet 4.6
    Anthropic Claude Opus 4.6
    Meta Llama 4 Maverick 17B Instruct
    Mistral Pixtral Large (25.02)
    Stable Diffusion 3.5 Large

Documentation Console
Amazon Bedrock AgentCore

Amazon Bedrock AgentCore 
enables you to deploy and operate highly effective AI agents securely at scale using any framework and model. AgentCore provides composable services that work with popular open-source frameworks like LangGraph, CrewAI, and Strands Agents, offering enterprise-grade security and reliability without sacrificing open-source flexibility.

Key services include:

    Runtime: Serverless runtime for deploying dynamic AI agents with fast cold starts and session isolation
    Identity: Secure agent identity and access management with existing identity provider compatibility
    Memory: Context-aware agents with short-term and long-term memory capabilities
    Code Interpreter: Secure code execution in isolated sandbox environments
    Browser: Cloud-based browser runtime for agents to interact with websites at scale
    Gateway: Secure tool discovery and API transformation for agent-compatible tools
    Observability: Unified dashboards for tracing, debugging, and monitoring agent performance

Documentation Console
AWS Security Agent

AWS Security Agent 
is an autonomous security analyst that proactively secures applications throughout the development lifecycle. It understands your application architecture, code, and security requirements to continuously scan for violations and conduct on-demand penetration testing without scheduling delays. The agent performs automated security reviews tailored to your organizational requirements and discovers vulnerabilities before applications reach production.

Documentation Console
AWS DevOps Agent

AWS DevOps Agent 
accelerates incident response and improves system reliability by acting as an always-on virtual operations team member. When alerts fire from CloudWatch, ServiceNow, or PagerDuty, the agent automatically investigates by analyzing logs, traces, and code changes. It identifies probable root causes, recommends mitigations, and coordinates incident response through Slack channels while maintaining detailed investigation timelines.

Documentation Console
Additional AWS AI/ML Services

Beyond the services listed above, you have access to the full suite of AWS AI and machine learning services during this hackathon. These include but are not limited to:

    Amazon Rekognition - Image and video analysis for object detection, facial analysis, and content moderation
    Amazon Polly - Text-to-speech service with lifelike voices
    Amazon Translate - Neural machine translation for real-time language translation
    Amazon Forecast - Time-series forecasting using machine learning
    Amazon Macie - Data security service that discovers and protects sensitive data
    Amazon HealthLake - HIPAA-eligible service for storing and analyzing health data
    AWS HealthScribe - Automatically generate clinical documentation from patient-clinician conversations

Feel free to explore and integrate any AWS AI/ML service that helps you build your solution. The hackathon environment provides broad access to experiment with these capabilities.
Amazon SageMaker

Amazon SageMaker 
is a fully managed machine learning service. It is designed to make it easier for developers and data scientists to build, train, and deploy machine learning models at scale. It provides an integrated Jupyter 
authoring notebook instance for easy access to your data sources for exploration and analysis, so you don't have to manage servers. It also provides common machine learning algorithms 
that are optimized to run efficiently against extremely large data in a distributed environment. With native support for bring-your-own-algorithms and frameworks, SageMaker offers flexible distributed training options that adjust to your specific workflows.

    To make it easier to get started, Amazon SageMaker JumpStart provides a set of solutions for the most common use cases that can be deployed readily with just a few clicks.

    Prepare, build, train, and deploy high-quality machine learning models quickly by bringing together a broad set of capabilities purpose-built for machine learning.

    Amazon SageMaker is available for free, for 2 months, as part of the AWS Free Tier program. Users can get access to 250 hours per month of ml.t3.medium notebooks usage with the Free Tier.

Documentation Console
Amazon Simple Storage Service (S3)

Amazon Simple Storage Service (S3) 
is a highly scalable and widely used cloud-based object storage service. It is designed to store and retrieve data, making it a fundamental building block for many cloud-based applications and services.

    Amazon S3 is an object storage service that offers industry-leading scalability, data availability, security, and performance.

    Store and protect any amount of data for a range of use cases, such as data lakes, websites, cloud-native applications, backups, archive, machine learning, and analytics.

    Amazon S3 is designed for 99.999999999% (11 9's) of durability, and stores data for millions of customers all around the world.

Documentation Console
Amazon S3 Tables

Amazon S3 Tables 
is a new storage class for Apache Iceberg tables that delivers up to 3x faster query performance and up to 10x higher transactions per second compared to general-purpose S3 storage. S3 Tables provides purpose-built table storage optimized for analytics workloads with automatic optimization, governance, and management capabilities.

Documentation Console
Amazon S3 Vectors

Amazon S3 Vectors 
is a purpose-built vector storage solution that enables high-performance similarity search and retrieval for AI and machine learning applications. S3 Vectors provides optimized storage and indexing for vector embeddings with seamless integration into generative AI workflows.

Documentation Console
Amazon CloudFront

Amazon CloudFront 
is a content delivery network (CDN) service built for high performance, security, and developer convenience. Together with S3, it enables Storing and Delivering your Content with Speed and Scale. Improve security with traffic encryption and access controls, and use AWS Shield Standard to defend against DDoS attacks at no additional charge.

Documentation Console
Amazon DynamoDB

Amazon DynamoDB 
is a fully managed, serverless NoSQL database service offered by AWS, designed for high-performance applications requiring seamless scalability. It supports key-value and document data models, offering consistent single-digit millisecond latency at any scale. DynamoDB features automatic scaling, high availability across multiple regions, robust security controls, and integration with other AWS services. It's particularly well-suited for serverless architectures, applications with large data volumes and strict latency requirements, and use cases with simple, known access patterns. While its denormalized data model differs from traditional relational databases, DynamoDB's simplicity and performance make it a popular choice for modern, cloud-native applications.

Documentation Console
AWS Step Functions

AWS Step Functions 
is a visual workflow service that allows developers to orchestrate distributed applications and microservices using a series of event-driven steps. It enables you to coordinate multiple AWS services into serverless workflows, automating processes, orchestrating microservices, and creating data and machine learning pipelines. Step Functions is based on state machines and tasks, where each step in a workflow is called a state, and tasks represent units of work performed by other AWS services. This service provides built-in controls for examining the state of each step, ensuring that your application runs in order and as expected, while reducing the amount of code you need to write and maintain.

Documentation Console
Amazon API Gateway

Amazon API Gateway 
is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. APIs act as the "front door" for applications to access data, business logic, or functionality from your backend services. Using API Gateway, you can create RESTful APIs and WebSocket APIs that enable real-time two-way communication applications. API Gateway supports containerized and serverless workloads, as well as web applications.

Documentation Console
AWS Lambda

AWS Lambda 
lets you run code without provisioning or managing servers. You pay only for the compute time you consume. AWS Lambda is a compute service that runs your code in response to events and automatically manages the compute resources, making it the fastest way to turn an idea into a modern, production, serverless applications.

Documentation Console
Amazon Q

Amazon Q 
is a generative AI-powered assistant created by Amazon Web Services (AWS) to help customers with their AWS-related tasks and queries.

Documentation Console
Amazon Opensearch Service

Amazon Opensearch Service 
Service is a managed service that makes it easy for you to perform interactive log analytics, real-time application monitoring, website search, and more. OpenSearch is an open source, distributed search and analytics suite derived from Elasticsearch. Amazon OpenSearch Service offers the latest versions of OpenSearch, support for 19 versions of Elasticsearch (1.5 to 7.10 versions), as well as visualization capabilities powered by OpenSearch Dashboards and Kibana (1.5 to 7.10 versions).

Documentation Console
Amazon Textract

Amazon Textract 
is a document analysis service that detects and extracts printed text, handwriting, structured data (such as fields of interest and their values) and tables from images and scans of documents. Amazon Textract's machine learning models have been trained on millions of documents so that virtually any document type you upload is automatically recognized and processed for text extraction.

Documentation Console
Amazon Transcribe

Amazon Transcribe 
is a fully managed, automatic speech recognition (ASR) service that makes it easy for developers to add speech to text capabilities to their applications. It is powered by a next-generation, multi-billion parameter speech foundation model that delivers high accuracy transcriptions for streaming and recorded speech.

Documentation Console
Amazon Kendra

Amazon Kendra 
is a highly accurate and easy-to-use enterprise search service that’s powered by machine learning (ML). It allows developers to add search capabilities to their applications so their end users can discover information stored within the vast amount of content spread across their company.

Documentation Console
Amazon Neptune

Amazon Neptune 
is a serverless graph database designed for superior scalability and availability. Neptune Database provides built-in security, continuous backups, and integrations with other AWS services.

Documentation Console
Amazon Comprehend

Amazon Comprehend 
is a natural language processing (NLP) service that uses machine learning to find meaning and insights in text.

Documentation Console
Amazon Personalize

Amazon Personalize 
is a fully managed machine learning (ML) service that uses your data to generate product and content recommendations for your users. You provide data about your end-users (e.g., age, location, device type), items in your catalog (e.g., genre, price) and interactions between users and items (e.g., clicks, purchases).

Documentation Console
Amazon Lookout for Metrics

Amazon Lookout for Metrics 
is an AI service that detects anomalies in business data using machine learning. It identifies outliers, diagnoses root causes, and groups related anomalies, enabling quick issue resolution. The service integrates with AWS databases and third-party applications for easy monitoring and customized alerts.

Documentation Console
Amazon Relational Database Service

Amazon RDS 
is an easy-to-manage relational database service optimized for total cost of ownership. It is simple to set up, operate, and scale with demand. Amazon RDS automates undifferentiated database management tasks, such as provisioning, configuring, backing up, and patching.

Documentation Console
Amazon Glue

Amazon Glue 
is a serverless data integration service that makes it easier to discover, prepare, and combine data for analytics, machine learning (ML), and application development. AWS Glue provides all the capabilities needed for data integration, so you can start analyzing your data and putting it to use in minutes instead of months.

Documentation Console
Amazon Kinesis Data Streams

Amazon Kinesis Data Streams 
build custom applications that process or analyze streaming data for specialized needs. You can add various types of data such as clickstreams, application logs, and social media to a Kinesis data stream from hundreds of thousands of sources.

Documentation Console
Amazon Data Firehose

Amazon Data Firehose 
is the easiest way to load streaming data into data stores and analytics tools. It can capture, transform, and load streaming data into Amazon S3, Amazon Redshift, Amazon OpenSearch Service, Snowflake, Apache Iceberg tables and Splunk, enabling near real-time analytics with existing business intelligence tools and dashboards you’re already using today.

Documentation Console
Amazon EventBridge

Amazon EventBridge 
is a service that provides real-time access to changes in data in AWS services, your own applications, and software as a service (SaaS) applications without writing code.

Documentation Console
Amazon QuickSight

Amazon QuickSight 
powers data-driven organizations with unified business intelligence (BI) at hyperscale. With QuickSight, all users can meet varying analytic needs from the same source of truth through modern interactive dashboards, pixel-perfect reports, natural language queries and embedded analytics.

Documentation Console
AWS Amplify

AWS Amplify 
is a development platform that simplifies building, connecting, and hosting full-stack web and mobile applications. It provides tools for various platforms, including iOS, Android, and web, enabling easy integration of features like authentication and data storage. With its user-friendly interface and scalable infrastructure, Amplify allows developers to focus on app development without needing extensive cloud expertise.

Documentation Console
Amazon Athena

Amazon Athena 
interactive analytics service that makes it simple to analyze data in Amazon Simple Storage Service (S3) using SQL. Athena is serverless, so there is no infrastructure to set up or manage, and you can start analyzing data immediately.

Documentation Console
Amazon Redshift

Amazon Redshift 
uses SQL to analyze structured and semistructured data across data warehouses, operational databases, and data lakes, using hardware and ML designed by AWS to deliver the best price performance at any scale.

Documentation Console
Amazon Simple Queue Service (SQS)

Amazon Simple Queue Service (SQS) 
is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. SQS eliminates the complexity and overhead associated with managing and operating message-oriented middleware, and empowers developers to focus on differentiating work. Using SQS, you can send, store, and receive messages between software components at any volume, without losing messages or requiring other services to be available.

Documentation Console
Amazon Lex

Amazon Lex 
is a fully managed AI service with advanced natural language models to design, build, test, and deploy conversational interfaces in applications. With Amazon Lex, you can build bots that increase contact center productivity, automate simple tasks, and drive operational efficiencies across the enterprise. As a fully managed service, Amazon Lex scales automatically, so you don't need to worry about managing infrastructure.

Documentation Console
Amazon ElastiCache

Amazon ElastiCache 
is a fully managed in-memory caching service supporting flexible, real-time use cases. You can use ElastiCache for caching, which accelerates application and database performance, or as a primary data store for use cases that don't require durability like session stores, gaming leaderboards, streaming, and analytics. ElastiCache is compatible with Redis and Memcached.

Documentation Console
Amazon MemoryDB for Redis

Amazon MemoryDB for Redis 
is a durable, in-memory database service that delivers ultra-fast performance. It is purpose-built for modern applications with microservices architectures. MemoryDB stores the entire dataset in memory, enables microsecond read latency, single-digit millisecond write latency, and offers Multi-AZ durability. It is compatible with Redis, a popular open source data store, enabling you to quickly build applications using the same flexible and friendly Redis data structures, APIs, and commands that they already use today.
