"""
Curated question bank — 60 questions across 6 categories × 3 difficulties.
Each question has scoring keywords that the AI engine uses to evaluate answers.
"""

QUESTIONS = [

    # ═══════════════════════════════════════════════════
    # DSA — Easy
    # ═══════════════════════════════════════════════════
    {
        "category": "dsa", "difficulty": "easy",
        "text": "What is the time complexity of searching in a hash table?",
        "keywords": "O(1),constant,average,collision,worst,O(n),hash function,bucket",
        "hint": "Consider average vs worst case.",
        "sample_answer": "Average case is O(1) due to direct key mapping. Worst case is O(n) when all keys collide into the same bucket."
    },
    {
        "category": "dsa", "difficulty": "easy",
        "text": "Explain the difference between a stack and a queue.",
        "keywords": "LIFO,FIFO,last in first out,first in first out,push,pop,enqueue,dequeue,top",
        "hint": "Think about the order elements are removed.",
        "sample_answer": "Stack is LIFO (Last In First Out) — elements are added and removed from the same end. Queue is FIFO (First In First Out) — elements are added at the rear and removed from the front."
    },
    {
        "category": "dsa", "difficulty": "easy",
        "text": "What is a linked list and how does it differ from an array?",
        "keywords": "node,pointer,next,dynamic,contiguous,memory,O(1) insertion,O(n) access,random access",
        "hint": "Focus on memory layout and access patterns.",
        "sample_answer": "A linked list stores elements as nodes with data and a pointer to the next node. Unlike arrays, it uses non-contiguous memory, allowing O(1) insertion/deletion but O(n) access."
    },
    {
        "category": "dsa", "difficulty": "easy",
        "text": "What is binary search and when can you use it?",
        "keywords": "sorted,O(log n),divide,mid,left,right,halve,prerequisite,monotonic",
        "hint": "Think about the precondition required.",
        "sample_answer": "Binary search works on sorted arrays by repeatedly dividing the search space in half. It has O(log n) complexity and requires the data to be sorted."
    },

    # ─── DSA — Medium ───────────────────────────────────
    {
        "category": "dsa", "difficulty": "medium",
        "text": "Explain Dijkstra's algorithm. What is its time complexity?",
        "keywords": "shortest path,weighted,priority queue,greedy,O(V log V),E log V,relaxation,visited,non-negative",
        "hint": "Think about which data structure makes it efficient.",
        "sample_answer": "Dijkstra's finds shortest paths from a source in a weighted graph. It uses a min-heap priority queue for O((V + E) log V). It doesn't work with negative edge weights."
    },
    {
        "category": "dsa", "difficulty": "medium",
        "text": "What is dynamic programming? Give an example.",
        "keywords": "overlapping subproblems,optimal substructure,memoization,tabulation,fibonacci,knapsack,top-down,bottom-up",
        "hint": "Mention the two key properties that make DP applicable.",
        "sample_answer": "DP solves problems by breaking them into overlapping subproblems and storing results (memoization/tabulation). Classic examples: Fibonacci, 0/1 Knapsack, LCS."
    },
    {
        "category": "dsa", "difficulty": "medium",
        "text": "Explain how a balanced BST (AVL or Red-Black) maintains balance.",
        "keywords": "rotation,height,balance factor,left rotate,right rotate,AVL,red-black,O(log n),self-balancing",
        "hint": "Describe what happens on insert/delete.",
        "sample_answer": "AVL trees maintain a balance factor (height difference ≤ 1) and perform rotations on insert/delete. Red-Black trees use color properties to ensure O(log n) height."
    },
    {
        "category": "dsa", "difficulty": "medium",
        "text": "What is the difference between BFS and DFS? When do you use each?",
        "keywords": "breadth first,depth first,queue,stack,shortest path,level order,cycle,topological,memory",
        "hint": "Think about what each guarantees.",
        "sample_answer": "BFS uses a queue, explores level by level, and finds shortest paths in unweighted graphs. DFS uses a stack/recursion and is better for cycle detection, topological sort, and pathfinding."
    },

    # ─── DSA — Hard ─────────────────────────────────────
    {
        "category": "dsa", "difficulty": "hard",
        "text": "Explain the concept of amortized analysis with the dynamic array example.",
        "keywords": "amortized,O(1),doubling,aggregate,accounting,potential,resize,push,append,average",
        "hint": "How does the cost of resizing spread over many operations?",
        "sample_answer": "Amortized analysis looks at average cost per operation over a sequence. Dynamic array doubling causes O(n) resize occasionally, but spread across n appends gives O(1) amortized cost."
    },
    {
        "category": "dsa", "difficulty": "hard",
        "text": "Describe the Union-Find (Disjoint Set Union) data structure and its applications.",
        "keywords": "union,find,path compression,rank,union by rank,cycle detection,Kruskal,connected components,O(alpha n)",
        "hint": "Mention the two key optimizations.",
        "sample_answer": "DSU tracks disjoint sets with Find (with path compression) and Union (by rank). Optimized version runs in near O(1) amortized. Used in Kruskal's MST, cycle detection, and network connectivity."
    },

    # ═══════════════════════════════════════════════════
    # System Design — Easy
    # ═══════════════════════════════════════════════════
    {
        "category": "system_design", "difficulty": "easy",
        "text": "What is the difference between vertical and horizontal scaling?",
        "keywords": "vertical,horizontal,scale up,scale out,CPU,RAM,load balancer,distributed,single point of failure,cost",
        "hint": "Think about limits and tradeoffs.",
        "sample_answer": "Vertical scaling adds more CPU/RAM to one machine (limited by hardware). Horizontal scaling adds more machines behind a load balancer (theoretically unlimited, but adds complexity)."
    },
    {
        "category": "system_design", "difficulty": "easy",
        "text": "Explain the purpose of a CDN (Content Delivery Network).",
        "keywords": "edge,cache,latency,geographic,static,bandwidth,origin server,PoP,proximity",
        "hint": "Why does proximity to users matter?",
        "sample_answer": "CDNs cache static assets (images, CSS, JS) on edge servers distributed globally, reducing latency by serving content from the nearest point of presence rather than the origin server."
    },
    {
        "category": "system_design", "difficulty": "easy",
        "text": "What is caching and what are common caching strategies?",
        "keywords": "cache-aside,write-through,write-behind,read-through,eviction,LRU,TTL,Redis,Memcached,hit,miss",
        "hint": "Name at least 2-3 strategies.",
        "sample_answer": "Caching stores frequently accessed data in fast storage. Strategies: Cache-aside (app checks cache first), Write-through (write to cache and DB simultaneously), Write-behind (async DB write). Eviction: LRU, LFU, TTL."
    },

    # ─── System Design — Medium ──────────────────────────
    {
        "category": "system_design", "difficulty": "medium",
        "text": "How would you design a URL shortening service like bit.ly?",
        "keywords": "hash,base62,redirect,302,301,database,collision,custom alias,analytics,KV store,unique",
        "hint": "Think about the encoding scheme and redirect type.",
        "sample_answer": "Generate a unique 6-7 char base62 hash of the URL, store in a KV store mapping short→long. On access, 302 redirect (don't cache) or 301 (cacheable). Handle collisions by retrying. Add analytics, rate limiting, custom aliases."
    },
    {
        "category": "system_design", "difficulty": "medium",
        "text": "Explain the CAP theorem.",
        "keywords": "consistency,availability,partition tolerance,trade-off,CP,AP,network partition,distributed",
        "hint": "A distributed system can only guarantee 2 of 3.",
        "sample_answer": "CAP theorem states a distributed system can only guarantee 2 of: Consistency (every read gets the latest write), Availability (every request gets a response), Partition Tolerance (system continues despite network failures). In practice, partitions happen, so you choose between CP (strong consistency) or AP (high availability)."
    },
    {
        "category": "system_design", "difficulty": "medium",
        "text": "How would you design a rate limiter?",
        "keywords": "token bucket,leaky bucket,sliding window,fixed window,Redis,counter,TTL,429,distributed,per-user",
        "hint": "Name the algorithm you'd choose and why.",
        "sample_answer": "Token Bucket: replenish tokens at a fixed rate; requests consume tokens. Sliding Window Log: track exact timestamps in Redis with TTL. For distributed rate limiting, use Redis INCR + EXPIRE for per-user keys."
    },

    # ─── System Design — Hard ───────────────────────────
    {
        "category": "system_design", "difficulty": "hard",
        "text": "Design a distributed message queue (like Kafka). What are the key components?",
        "keywords": "producer,consumer,broker,topic,partition,offset,consumer group,replication,durability,at-least-once,exactly-once,log",
        "hint": "Think about ordering guarantees and failure recovery.",
        "sample_answer": "Key components: Producers publish to Topics divided into Partitions. Brokers store ordered, immutable log. Consumers track Offsets in Consumer Groups. Replicas provide fault tolerance. Supports at-least-once delivery; exactly-once via idempotent producers + transactions."
    },
    {
        "category": "system_design", "difficulty": "hard",
        "text": "How do you ensure data consistency in a microservices architecture?",
        "keywords": "saga,two-phase commit,2PC,eventual consistency,outbox pattern,event sourcing,CQRS,idempotent,compensation",
        "hint": "Distributed transactions are expensive — what are the alternatives?",
        "sample_answer": "Avoid distributed transactions where possible. Use Saga pattern (choreography or orchestration) with compensating transactions. Outbox pattern ensures events are reliably published. Design idempotent APIs. Accept eventual consistency with event sourcing + CQRS."
    },

    # ═══════════════════════════════════════════════════
    # Behavioral — Easy
    # ═══════════════════════════════════════════════════
    {
        "category": "behavioral", "difficulty": "easy",
        "text": "Tell me about yourself and your background in software development.",
        "keywords": "experience,project,technology,skill,achieve,background,role,team,passion,language",
        "hint": "Use a structured format: background → experience → goals.",
        "sample_answer": "Structured response covering: educational background, key projects/roles, technical stack, notable achievements, and what you're looking for next."
    },
    {
        "category": "behavioral", "difficulty": "easy",
        "text": "Describe a project you're most proud of.",
        "keywords": "challenge,solution,impact,learned,team,result,technology,metric,outcome,responsibility",
        "hint": "Use the STAR method: Situation, Task, Action, Result.",
        "sample_answer": "STAR: Describe the project context, your specific role, the technical challenges faced, the solution you implemented, and measurable outcomes (users, performance gains, revenue)."
    },

    # ─── Behavioral — Medium ─────────────────────────────
    {
        "category": "behavioral", "difficulty": "medium",
        "text": "Tell me about a time you had a conflict with a team member. How did you resolve it?",
        "keywords": "conflict,communicate,listen,compromise,perspective,resolve,outcome,empathy,professional,result",
        "hint": "Focus on the resolution process and what you learned.",
        "sample_answer": "STAR: Describe the disagreement, how you initiated a private conversation, listened to their perspective, found common ground or escalated appropriately, and the positive outcome for the team."
    },
    {
        "category": "behavioral", "difficulty": "medium",
        "text": "Describe a time you had to learn a new technology quickly under pressure.",
        "keywords": "deadline,learn,resource,documentation,mentor,prototype,deliver,adapt,challenge,success",
        "hint": "Show your learning strategy and outcome.",
        "sample_answer": "STAR: Context of tight deadline, your systematic approach (docs, tutorials, side project), how you applied it to the real problem, and the successful delivery with lessons learned."
    },

    # ─── Behavioral — Hard ──────────────────────────────
    {
        "category": "behavioral", "difficulty": "hard",
        "text": "Tell me about a time you had to make a critical technical decision with incomplete information.",
        "keywords": "risk,assumption,data,trade-off,stakeholder,decision,outcome,fallback,iterate,own",
        "hint": "Show your decision-making framework.",
        "sample_answer": "STAR: Describe the ambiguous situation, how you gathered available data, consulted stakeholders, evaluated trade-offs with explicit assumptions, made a call with a fallback plan, and monitored outcomes."
    },

    # ═══════════════════════════════════════════════════
    # JavaScript — Easy
    # ═══════════════════════════════════════════════════
    {
        "category": "javascript", "difficulty": "easy",
        "text": "What is the difference between == and === in JavaScript?",
        "keywords": "strict equality,type coercion,loose,convert,NaN,null,undefined,type",
        "hint": "One converts types before comparing.",
        "sample_answer": "== performs type coercion before comparison (e.g., '5' == 5 is true). === checks value AND type with no coercion ('5' === 5 is false). Always prefer === to avoid unexpected coercion bugs."
    },
    {
        "category": "javascript", "difficulty": "easy",
        "text": "Explain the difference between var, let, and const.",
        "keywords": "scope,function scope,block scope,hoisting,redeclare,reassign,temporal dead zone,TDZ",
        "hint": "Think about scoping rules and hoisting behavior.",
        "sample_answer": "var is function-scoped and hoisted (initialized to undefined). let is block-scoped, hoisted but in TDZ, can be reassigned. const is block-scoped, cannot be reassigned (but objects are mutable)."
    },
    {
        "category": "javascript", "difficulty": "easy",
        "text": "What is a closure in JavaScript?",
        "keywords": "inner function,outer scope,lexical environment,retain,access,variable,private,encapsulation,factory",
        "hint": "How does a function 'remember' variables from its outer scope?",
        "sample_answer": "A closure is an inner function that retains access to its outer function's variables even after the outer function has returned. This enables data encapsulation and factory functions."
    },

    # ─── JavaScript — Medium ─────────────────────────────
    {
        "category": "javascript", "difficulty": "medium",
        "text": "Explain the JavaScript event loop. How does it handle async operations?",
        "keywords": "call stack,task queue,microtask,macrotask,Promise,setTimeout,event loop,Web API,non-blocking",
        "hint": "Microtasks vs macrotasks — which runs first?",
        "sample_answer": "JS is single-threaded with an event loop. Async ops go to Web APIs. Callbacks enter the task/microtask queue. Microtasks (Promises) run before macrotasks (setTimeout). The event loop picks from queues when the call stack is empty."
    },
    {
        "category": "javascript", "difficulty": "medium",
        "text": "What are Promises and how do they differ from callbacks?",
        "keywords": "resolve,reject,then,catch,finally,chain,callback hell,async/await,pending,fulfilled",
        "hint": "What problem do Promises solve?",
        "sample_answer": "Promises represent a future value with states: pending, fulfilled, rejected. They solve callback hell by enabling .then() chaining. async/await is syntactic sugar over Promises for cleaner sequential async code."
    },
    {
        "category": "javascript", "difficulty": "medium",
        "text": "Explain prototypal inheritance in JavaScript.",
        "keywords": "prototype,__proto__,prototype chain,Object.create,inherit,method lookup,constructor,class",
        "hint": "How does property lookup traverse the chain?",
        "sample_answer": "Every JS object has a prototype. Property lookup traverses the prototype chain until found or null is reached. Classes are syntactic sugar over prototype-based inheritance. Object.create() enables explicit prototype setting."
    },

    # ─── JavaScript — Hard ──────────────────────────────
    {
        "category": "javascript", "difficulty": "hard",
        "text": "What are generators and how do they differ from async/await?",
        "keywords": "function*,yield,iterator,next,lazy,suspend,resume,Symbol.iterator,coroutine,infinite sequence",
        "hint": "Generators are lower-level than async/await.",
        "sample_answer": "Generators (function*) can pause execution with yield and resume via .next(). They're lazy iterators, enabling infinite sequences and custom iteration. async/await is built on generators but specifically designed for Promises and async I/O."
    },

    # ═══════════════════════════════════════════════════
    # Python — Easy
    # ═══════════════════════════════════════════════════
    {
        "category": "python", "difficulty": "easy",
        "text": "What is the difference between a list and a tuple in Python?",
        "keywords": "mutable,immutable,ordered,hashable,performance,brackets,parentheses,modify,use case",
        "hint": "Which one can be used as a dict key?",
        "sample_answer": "Lists are mutable (can change elements), tuples are immutable. Tuples are hashable and can be dict keys/set members. Tuples are slightly faster and signal immutable intent. Both maintain order."
    },
    {
        "category": "python", "difficulty": "easy",
        "text": "Explain Python decorators. Give a practical example.",
        "keywords": "wrapper,higher-order,function,@,wraps,functools,logging,timing,authentication,modify behavior",
        "hint": "Decorators are functions that take functions as arguments.",
        "sample_answer": "Decorators are higher-order functions that modify behavior without changing source code. Using @functools.wraps to preserve metadata. Common uses: logging, timing, authentication (@login_required), caching (@lru_cache)."
    },
    {
        "category": "python", "difficulty": "easy",
        "text": "What are list comprehensions and when should you use them?",
        "keywords": "expression,iterable,filter,concise,readable,performance,map,filter,nested,generator",
        "hint": "Compare with traditional for loops.",
        "sample_answer": "List comprehensions offer concise syntax: [expr for item in iterable if condition]. Faster than equivalent for loops due to optimized bytecode. Prefer for simple transformations; use regular loops for complex logic to maintain readability."
    },

    # ─── Python — Medium ─────────────────────────────────
    {
        "category": "python", "difficulty": "medium",
        "text": "Explain the GIL (Global Interpreter Lock) in CPython.",
        "keywords": "GIL,thread,mutex,CPython,IO-bound,CPU-bound,multiprocessing,concurrent,parallel,bytecode",
        "hint": "When does the GIL hurt and when doesn't it matter?",
        "sample_answer": "The GIL is a mutex in CPython preventing multiple native threads from executing Python bytecode simultaneously. It limits CPU-bound parallelism (use multiprocessing instead). IO-bound tasks benefit from threading since the GIL is released during IO operations."
    },
    {
        "category": "python", "difficulty": "medium",
        "text": "What are Python generators and when are they useful?",
        "keywords": "yield,lazy,iterator,memory,generator expression,next,StopIteration,pipeline,large data",
        "hint": "Why do generators save memory?",
        "sample_answer": "Generators use yield to produce values lazily, one at a time. They save memory for large datasets since all values aren't held in memory. Useful for data pipelines, reading large files, and infinite sequences."
    },
    {
        "category": "python", "difficulty": "medium",
        "text": "Explain the difference between @classmethod and @staticmethod.",
        "keywords": "cls,self,instance,class,first argument,factory,utility,no instance,inheritance",
        "hint": "What does each receive as its first argument?",
        "sample_answer": "@classmethod receives the class (cls) as first arg — useful for factory methods and accessing class state. @staticmethod receives no implicit argument — pure utility functions that logically belong to the class but don't need class/instance access."
    },

    # ─── Python — Hard ───────────────────────────────────
    {
        "category": "python", "difficulty": "hard",
        "text": "Explain Python metaclasses. When would you use one?",
        "keywords": "type,__new__,__init__,class creation,metaclass,interface,ORM,singleton,plugin,registry",
        "hint": "Metaclasses are to classes as classes are to instances.",
        "sample_answer": "Metaclasses are classes whose instances are classes. type is the default metaclass. Custom metaclasses override __new__/__init__ to control class creation. Used in ORMs (Django models), enforcing interface contracts, singletons, and plugin registries."
    },

    # ═══════════════════════════════════════════════════
    # SQL — Easy
    # ═══════════════════════════════════════════════════
    {
        "category": "sql", "difficulty": "easy",
        "text": "What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN?",
        "keywords": "matching,all rows,left table,right table,NULL,intersection,outer join,unmatched",
        "hint": "Think about which rows are preserved.",
        "sample_answer": "INNER JOIN: only matching rows. LEFT JOIN: all rows from left table + matching right (NULLs for no match). RIGHT JOIN: opposite of LEFT. FULL OUTER JOIN: all rows from both, NULLs where no match."
    },
    {
        "category": "sql", "difficulty": "easy",
        "text": "Explain the difference between WHERE and HAVING clauses.",
        "keywords": "filter,GROUP BY,aggregate,before,after,function,SUM,COUNT,AVG,row level,group level",
        "hint": "One filters before grouping, one after.",
        "sample_answer": "WHERE filters individual rows before aggregation. HAVING filters groups after GROUP BY. You can't use aggregate functions in WHERE — that's what HAVING is for (e.g., HAVING COUNT(*) > 5)."
    },
    {
        "category": "sql", "difficulty": "easy",
        "text": "What is an index and how does it improve query performance?",
        "keywords": "B-tree,lookup,scan,full table scan,index scan,write overhead,composite,covering index,cardinality",
        "hint": "What's the tradeoff for write operations?",
        "sample_answer": "An index is a B-tree data structure enabling fast lookup by avoiding full table scans. Trade-off: faster reads but slower writes (index must be updated). Composite indexes should match query column order."
    },

    # ─── SQL — Medium ────────────────────────────────────
    {
        "category": "sql", "difficulty": "medium",
        "text": "What are database transactions and what are the ACID properties?",
        "keywords": "atomicity,consistency,isolation,durability,commit,rollback,ACID,all or nothing,concurrent",
        "hint": "Define each letter of ACID.",
        "sample_answer": "ACID — Atomicity: all or nothing. Consistency: valid state before and after. Isolation: concurrent transactions don't interfere. Durability: committed data survives failures. Transactions group operations into an atomic unit with COMMIT/ROLLBACK."
    },
    {
        "category": "sql", "difficulty": "medium",
        "text": "Explain the N+1 query problem and how to solve it.",
        "keywords": "N+1,ORM,eager loading,JOIN,lazy loading,batch,IN,select related,prefetch",
        "hint": "What's wrong with loading relations in a loop?",
        "sample_answer": "N+1: 1 query to fetch N records, then N queries to fetch related data — O(N) queries total. Fix with JOIN or eager loading (SELECT related, prefetch_related in Django). Alternatively batch with WHERE id IN (...)."
    },

    # ─── SQL — Hard ──────────────────────────────────────
    {
        "category": "sql", "difficulty": "hard",
        "text": "Explain isolation levels in SQL and the anomalies each prevents.",
        "keywords": "read uncommitted,read committed,repeatable read,serializable,dirty read,phantom read,non-repeatable,lock,MVCC",
        "hint": "Each level prevents increasingly severe anomalies.",
        "sample_answer": "4 levels: Read Uncommitted (allows dirty reads) → Read Committed (prevents dirty reads) → Repeatable Read (prevents non-repeatable reads) → Serializable (prevents phantom reads). Higher isolation = more locking overhead. Most DBs use MVCC to provide isolation without read locks."
    },
]


def get_questions(category: str = None, difficulty: str = None, limit: int = 5) -> list[dict]:
    """Filter questions by category and/or difficulty."""
    import random
    filtered = QUESTIONS
    if category and category != "all":
        filtered = [q for q in filtered if q["category"] == category]
    if difficulty and difficulty != "all":
        filtered = [q for q in filtered if q["difficulty"] == difficulty]
    random.shuffle(filtered)
    return filtered[:limit]
