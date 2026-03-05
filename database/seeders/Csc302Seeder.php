<?php

namespace Database\Seeders;

use App\Enums\AnswerDepthLevel;
use App\Enums\BloomLevel;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\TopicDifficulty;
use App\Enums\TopicWeight;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\Discipline;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\QuestionAnswer;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use App\Models\QuestionTopicLink;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class Csc302Seeder extends Seeder
{
    private string $courseId;

    private string $disciplineId;

    private string $contentUserId;

    private string $studentProfileId;

    private string $normalizationTopicId;

    public function run(): void
    {
        $mouau = Institution::where('abbreviation', 'MOUAU')->firstOrFail();

        $this->courseId = InstitutionCourse::where('institution_id', $mouau->id)
            ->where('course_code', 'CSC 302')
            ->firstOrFail()
            ->id;

        $this->disciplineId = Discipline::where('slug', 'computer-science')->firstOrFail()->id;

        $this->contentUserId = User::where('email', 'content@skoolpad.com')->firstOrFail()->id;

        $this->studentProfileId = StudentProfile::whereHas(
            'user',
            fn ($q) => $q->where('email', 'student@skoolpad.com')
        )->firstOrFail()->id;

        $this->normalizationTopicId = CanonicalTopic::where('slug', 'database-normalization')->firstOrFail()->id;

        $this->enrollStudent();
        $topics = $this->createTopics();
        $this->mapTopics($topics);
        $this->createAllBlocks($topics);
        $this->createQuestionPaper($topics);
    }

    private function enrollStudent(): void
    {
        StudentCourse::firstOrCreate([
            'student_profile_id' => $this->studentProfileId,
            'institution_course_id' => $this->courseId,
            'academic_year' => '2023/2024',
        ], [
            'semester' => 'first',
        ]);
    }

    /** @return array<string, CanonicalTopic> */
    private function createTopics(): array
    {
        $defs = [
            'intro' => ['Introduction to Database Systems', 'foundational', 12],
            'models' => ['Data Models and Database Architecture', 'foundational', 15],
            'er' => ['Entity-Relationship Modeling', 'intermediate', 20],
            'relational' => ['The Relational Model', 'intermediate', 18],
            'sql' => ['SQL Fundamentals', 'intermediate', 25],
            'advanced_sql' => ['Advanced SQL and Query Optimization', 'advanced', 22],
            'transactions' => ['Transaction Management and Concurrency Control', 'advanced', 20],
            'indexing' => ['Indexing and Storage Structures', 'advanced', 18],
            'security' => ['Database Security and Administration', 'intermediate', 15],
        ];

        $topics = [];
        foreach ($defs as $key => [$title, $difficulty, $readTime]) {
            $topics[$key] = CanonicalTopic::create([
                'discipline_id' => $this->disciplineId,
                'title' => $title,
                'slug' => Str::slug($title),
                'summary' => "Comprehensive coverage of {$title} for CSC 302.",
                'difficulty_level' => TopicDifficulty::from($difficulty),
                'estimated_read_minutes' => $readTime,
                'is_published' => true,
                'published_at' => now(),
            ]);
        }

        $topics['normalization'] = CanonicalTopic::find($this->normalizationTopicId);

        return $topics;
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function mapTopics(array $topics): void
    {
        CourseTopicMapping::where('institution_course_id', $this->courseId)->delete();

        $order = ['intro', 'models', 'er', 'relational', 'sql', 'normalization', 'advanced_sql', 'transactions', 'indexing', 'security'];
        $weights = [
            'intro' => TopicWeight::Core,
            'models' => TopicWeight::Core,
            'er' => TopicWeight::Core,
            'relational' => TopicWeight::Core,
            'sql' => TopicWeight::Core,
            'normalization' => TopicWeight::Core,
            'advanced_sql' => TopicWeight::Core,
            'transactions' => TopicWeight::Core,
            'indexing' => TopicWeight::Supplementary,
            'security' => TopicWeight::Supplementary,
        ];

        foreach ($order as $seq => $key) {
            CourseTopicMapping::create([
                'institution_course_id' => $this->courseId,
                'canonical_topic_id' => $topics[$key]->id,
                'sequence_order' => $seq + 1,
                'weight' => $weights[$key],
            ]);
        }
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function createAllBlocks(array $topics): void
    {
        $this->createIntroBlocks($topics['intro']);
        $this->createDataModelsBlocks($topics['models']);
        $this->createERBlocks($topics['er']);
        $this->createRelationalBlocks($topics['relational']);
        $this->createSQLBlocks($topics['sql']);
        $this->createNormalizationBlocks($topics['normalization']);
        $this->createAdvancedSQLBlocks($topics['advanced_sql']);
        $this->createTransactionBlocks($topics['transactions']);
        $this->createIndexingBlocks($topics['indexing']);
        $this->createSecurityBlocks($topics['security']);
    }

    /**
     * @param  array<int, array{title: string, type: string, children?: array<int, mixed>, content?: array<string, mixed>, simplified?: array<string, mixed>, readTime?: int, difficulty?: string, bloom?: string}>  $blocks
     */
    private function createBlocks(string $topicId, array $blocks, ?string $parentId = null, int $depth = 0, string $pathPrefix = ''): void
    {
        foreach ($blocks as $index => $def) {
            $sortOrder = $index + 1;
            $path = $pathPrefix ? "{$pathPrefix}.{$sortOrder}" : (string) $sortOrder;
            $isContainer = ($def['type'] ?? 'text') === 'container';

            $block = ContentBlock::create([
                'canonical_topic_id' => $topicId,
                'parent_block_id' => $parentId,
                'title' => $def['title'],
                'slug' => Str::slug($def['title']),
                'block_type' => $def['type'] ?? 'text',
                'path' => $path,
                'depth_level' => $depth,
                'sort_order' => $sortOrder,
                'content' => $def['content'] ?? null,
                'simplified_content' => $def['simplified'] ?? null,
                'estimated_read_time' => $def['readTime'] ?? ($isContainer ? null : 3),
                'difficulty_level' => $def['difficulty'] ?? 'intermediate',
                'bloom_level' => $def['bloom'] ?? 'understand',
                'is_container' => $isContainer,
                'is_published' => true,
            ]);

            if (! empty($def['children'])) {
                $this->createBlocks($topicId, $def['children'], $block->id, $depth + 1, $path);
            }
        }
    }

    private function createIntroBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'What is a Database?',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Definition and Core Concepts',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'beginner',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('A database is an organized collection of structured information, or data, typically stored electronically in a computer system. Unlike a simple collection of files, a database is designed to allow efficient access, management, and updating of data.'),
                            $this->p([
                                $this->text('The term '),
                                $this->bold('data'),
                                $this->text(' refers to known facts that can be recorded and have implicit meaning. For example, the names, phone numbers, and email addresses of students at a university constitute data. This data can be recorded in a structured format — once organized and made accessible, it becomes a '),
                                $this->bold('database'),
                                $this->text('.'),
                            ]),
                            $this->p('A database has the following implicit properties: it represents some aspect of the real world (the miniworld or Universe of Discourse), it is a logically coherent collection of data with inherent meaning, and it is designed, built, and populated with data for a specific purpose and intended group of users.'),
                        ]),
                        'simplified' => $this->doc([
                            $this->p('Think of a database like a super-organized digital filing cabinet. Instead of stuffing papers into folders, you store information in a computer in a way that makes it easy to find, change, and use.'),
                            $this->p('For example, your school keeps a database of all students — names, matric numbers, departments, and grades. When your department needs your transcript, they can pull up your records in seconds instead of searching through stacks of paper.'),
                        ]),
                    ],
                    [
                        'title' => 'File Systems vs Database Systems',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'beginner',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('Before databases, organizations used file-processing systems where each department maintained its own separate files. This approach led to several fundamental problems:'),
                            $this->ul([
                                'Data Redundancy and Inconsistency — the same data was duplicated across multiple files, and changes in one file might not be reflected in another',
                                'Difficulty in Accessing Data — retrieving specific information required writing new programs for each new query',
                                'Data Isolation — data scattered across files in different formats made writing new programs difficult',
                                'Integrity Problems — consistency constraints (like account balance ≥ 0) were buried in program code and hard to enforce across files',
                                'Atomicity Problems — if the system failed during a multi-step operation (like a bank transfer), partial updates could leave data in an inconsistent state',
                                'Concurrent Access Anomalies — multiple users updating the same data simultaneously could produce incorrect results',
                                'Security Problems — it was difficult to restrict each user to accessing only the data they were authorized to see',
                            ]),
                            $this->p('Database systems were developed specifically to address these problems. A Database Management System (DBMS) provides a centralized mechanism for defining, constructing, manipulating, and sharing databases among various users and applications.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'The Database Management System',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Components of a DBMS',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'beginner',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('A DBMS is a collection of interrelated software programs that enables users to create, maintain, and manipulate databases. The major components include:'),
                            $this->ul([
                                'Storage Manager — manages the allocation of space on disk storage and the data structures used to represent information. It translates DML statements into low-level file system commands.',
                                'Query Processor — parses, validates, and optimizes SQL statements before executing them. It includes the DDL interpreter, DML compiler, and query evaluation engine.',
                                'Transaction Manager — ensures that the database remains in a consistent state despite system failures and that concurrent transactions proceed without conflict.',
                                'Authorization and Integrity Manager — tests integrity constraints and checks the authority of users to access data.',
                                'Buffer Manager — manages the transfer of data between disk storage and main memory, caching frequently used data blocks.',
                            ]),
                            $this->p('Popular DBMS examples include Oracle, MySQL, PostgreSQL, Microsoft SQL Server, and SQLite. Each offers different features suited to different scales and use cases.'),
                        ]),
                    ],
                    [
                        'title' => 'Advantages of Using a DBMS',
                        'type' => 'text',
                        'readTime' => 2,
                        'difficulty' => 'beginner',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('Using a DBMS provides significant advantages over traditional file-based data management:'),
                            $this->ol([
                                'Data Independence — applications are insulated from changes to data storage and organization. Physical data independence allows changes to storage structures without affecting application programs. Logical data independence allows changes to the conceptual schema without affecting external schemas.',
                                'Reduced Redundancy — centralized control of data minimizes unnecessary duplication. When redundancy is required for performance, the DBMS can manage it to ensure consistency.',
                                'Data Integrity — integrity constraints (like "no student can have a negative GPA") are defined once and enforced automatically across all applications.',
                                'Concurrent Access — multiple users can access and modify the database simultaneously without data corruption, managed through locking and transaction mechanisms.',
                                'Backup and Recovery — the DBMS provides mechanisms to recover data after hardware or software failures, ensuring no committed transactions are lost.',
                                'Security — the DBMS provides fine-grained access control, allowing administrators to specify who can access what data and what operations they can perform.',
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Database Users and Interfaces',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Types of Database Users',
                        'type' => 'text',
                        'readTime' => 2,
                        'difficulty' => 'beginner',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('Different users interact with a database system in different ways, depending on their roles and technical capabilities:'),
                            $this->ul([
                                'Database Administrators (DBA) — responsible for authorizing access, coordinating and monitoring use, acquiring software and hardware resources. The DBA creates accounts, grants permissions, and handles schema modifications.',
                                'Database Designers — responsible for identifying the data to be stored and choosing appropriate structures. They communicate with all prospective users to understand their requirements and create a design that meets the needs of all user groups.',
                                'Application Programmers — software professionals who write application programs that access the database using DML calls embedded in a host language (Java, Python, PHP) or through frameworks and ORMs.',
                                'End Users — people who interact with the database through application interfaces. They range from casual users (managers making occasional queries) to parametric users (bank tellers, booking clerks who run predefined transactions repeatedly).',
                            ]),
                        ]),
                    ],
                    [
                        'title' => 'Database Languages',
                        'type' => 'text',
                        'readTime' => 2,
                        'difficulty' => 'beginner',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('Database systems provide specialized languages for different aspects of database interaction:'),
                            $this->ul([
                                'Data Definition Language (DDL) — used to specify the database schema. DDL statements define tables, columns, data types, and constraints. Example: CREATE TABLE, ALTER TABLE, DROP TABLE.',
                                'Data Manipulation Language (DML) — used to retrieve and modify data. DML includes SELECT (retrieval), INSERT (addition), UPDATE (modification), and DELETE (removal) statements.',
                                'Data Control Language (DCL) — used to control access to data. Includes GRANT (give permissions) and REVOKE (remove permissions) statements.',
                                'Transaction Control Language (TCL) — used to manage transactions. Includes COMMIT (save changes), ROLLBACK (undo changes), and SAVEPOINT (set a point to roll back to).',
                            ]),
                            $this->p('In practice, SQL (Structured Query Language) combines all four language types into a single comprehensive language, which is the standard for relational database systems.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createDataModelsBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Data Models',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Hierarchical and Network Models',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'beginner',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('The '),
                                $this->bold('Hierarchical Model'),
                                $this->text(' (1960s) was one of the first database models, pioneered by IBM\'s IMS (Information Management System). Data is organized in a tree-like structure where each record has a single parent and potentially many children — similar to a file system\'s directory structure. While simple and fast for predefined queries, it struggles with many-to-many relationships and requires that access paths be known in advance.'),
                            ]),
                            $this->p([
                                $this->text('The '),
                                $this->bold('Network Model'),
                                $this->text(' (defined by the CODASYL committee) extended the hierarchical model by allowing records to have multiple parents, forming a graph structure. This enabled representation of many-to-many relationships directly. However, both models required application programs to navigate the physical data structures, tightly coupling programs to the database organization.'),
                            ]),
                            $this->p('These early models are now mostly of historical interest, having been largely replaced by the relational model in commercial database systems. However, understanding them provides context for appreciating the revolutionary simplicity of the relational approach.'),
                        ]),
                    ],
                    [
                        'title' => 'The Relational Model',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'beginner',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('Proposed by Edgar F. Codd at IBM in 1970, the '),
                                $this->bold('Relational Model'),
                                $this->text(' represents data as a collection of relations (tables). Each relation consists of rows (tuples) and columns (attributes). The model\'s elegance lies in its mathematical foundation in set theory and first-order predicate logic.'),
                            ]),
                            $this->p('Key advantages of the relational model include: data independence (programs need not know how data is physically stored), a declarative query language (SQL — you specify what data you want, not how to get it), a strong theoretical foundation that guarantees correctness of query transformations, and simplicity in both concept and usage.'),
                            $this->p('The relational model dominates commercial database systems today. Oracle, MySQL, PostgreSQL, SQL Server, and SQLite are all relational. This model forms the foundation of this entire course.'),
                        ]),
                    ],
                    [
                        'title' => 'Object-Oriented and NoSQL Models',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->bold('Object-Relational'),
                                $this->text(' databases extend the relational model with object-oriented features like user-defined types, inheritance, and complex objects. PostgreSQL is a prominent example, supporting custom types, array columns, and JSON data alongside traditional relational features.'),
                            ]),
                            $this->p([
                                $this->bold('NoSQL databases'),
                                $this->text(' emerged in the 2000s to handle web-scale applications requiring flexible schemas, horizontal scalability, and high availability. Major categories include:'),
                            ]),
                            $this->ul([
                                'Document stores (MongoDB, CouchDB) — store data as JSON/BSON documents with flexible schemas',
                                'Key-Value stores (Redis, DynamoDB) — simple but extremely fast lookup by key',
                                'Column-Family stores (Cassandra, HBase) — store data in column families, optimized for distributed storage',
                                'Graph databases (Neo4j, Amazon Neptune) — store entities as nodes and relationships as edges, ideal for highly connected data',
                            ]),
                            $this->p('NoSQL does not mean "no SQL" but rather "not only SQL." Many modern systems use a polyglot persistence approach, choosing the best data model for each specific use case.'),
                        ]),
                        'simplified' => $this->doc([
                            $this->p('Besides the regular table-based databases (like MySQL), there are newer types of databases:'),
                            $this->ul([
                                'Document databases (like MongoDB) store data as flexible "documents" — imagine each record is a Word document that can have different fields',
                                'Key-Value databases (like Redis) work like a dictionary — you look up a word (key) and get its definition (value). Super fast but simple.',
                                'Graph databases (like Neo4j) are great for social networks — they store connections between things, like who is friends with whom.',
                            ]),
                            $this->p('Most real applications use a mix of these — regular databases for transactions, Redis for fast caching, etc. This is called "polyglot persistence."'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Three-Schema Architecture',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'ANSI/SPARC Three Levels',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('The ANSI/SPARC three-schema architecture defines three levels of abstraction for database systems, each providing a different perspective on the same data:'),
                            $this->ol([
                                'External Level (View Level) — describes the part of the database that a particular user group is interested in. Each external schema (or view) hides the rest of the database from that user group. A university database might present different views to the admissions office, the finance department, and academic departments.',
                                'Conceptual Level (Logical Level) — describes the structure of the entire database for a community of users. It defines what data is stored and the relationships among those data. The conceptual schema hides physical storage details while describing entities, data types, relationships, constraints, and security/integrity information.',
                                'Internal Level (Physical Level) — describes the physical storage structure of the database. It deals with data storage, indexing, file organization, buffer management, and access paths. This level is closest to the actual physical storage.',
                            ]),
                            $this->p('The three-schema architecture enables data independence, which is the ability to change the schema at one level without having to change the schema at the next higher level.'),
                        ]),
                    ],
                    [
                        'title' => 'Data Independence',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'analyze',
                        'content' => $this->doc([
                            $this->p('Data independence is the capacity to change the schema at one level without affecting the schema at the next higher level. There are two types:'),
                            $this->p([
                                $this->bold('Logical Data Independence'),
                                $this->text(' — the ability to change the conceptual schema without having to change the external schemas or application programs. For example, adding a new column to a table should not break existing applications that do not use that column. This is harder to achieve in practice.'),
                            ]),
                            $this->p([
                                $this->bold('Physical Data Independence'),
                                $this->text(' — the ability to change the internal schema without having to change the conceptual schema. For example, moving the database to a faster disk, adding an index, or reorganizing the file structure should not require changes to the logical table definitions. This is generally easier to achieve and is supported by most modern DBMS.'),
                            ]),
                            $this->p('Data independence is one of the most important benefits of the database approach, as it significantly reduces the cost and effort of maintaining and evolving database applications over time.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createERBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Basic ER Concepts',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Entities and Attributes',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('An '),
                                $this->bold('entity'),
                                $this->text(' is a thing in the real world with an independent existence. An entity may be a physical object (a student, a car, a building) or a conceptual object (a course, a bank account, a job). Each entity has '),
                                $this->bold('attributes'),
                                $this->text(' — properties that describe it.'),
                            ]),
                            $this->p('Attribute types include:'),
                            $this->ul([
                                'Simple (Atomic) — cannot be divided further (e.g., Age, Gender)',
                                'Composite — composed of sub-attributes (e.g., FullName → FirstName, MiddleName, LastName)',
                                'Single-Valued — holds a single value for an entity (e.g., DateOfBirth)',
                                'Multi-Valued — may hold multiple values (e.g., PhoneNumbers, Degrees)',
                                'Derived — can be calculated from other attributes (e.g., Age derived from DateOfBirth)',
                                'Key Attribute — uniquely identifies each entity (e.g., StudentID, MatricNumber)',
                            ]),
                            $this->p([
                                $this->text('A '),
                                $this->bold('weak entity'),
                                $this->text(' cannot be uniquely identified by its own attributes alone — it depends on a related '),
                                $this->bold('strong (owner) entity'),
                                $this->text('. For example, a "Dependent" of an Employee cannot be uniquely identified without knowing which Employee they belong to. The relationship between them is called an identifying relationship.'),
                            ]),
                        ]),
                    ],
                    [
                        'title' => 'Relationships and Cardinality',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('A relationship is an association among two or more entities. Relationship types are characterized by their degree (number of participating entity types) and cardinality constraints.'),
                            $this->p([
                                $this->bold('Cardinality ratios'),
                                $this->text(' specify the maximum number of relationship instances an entity can participate in:'),
                            ]),
                            $this->ul([
                                'One-to-One (1:1) — each entity in A is associated with at most one entity in B, and vice versa. Example: each department has exactly one head, and each professor heads at most one department.',
                                'One-to-Many (1:N) — each entity in A can be associated with many entities in B, but each entity in B is associated with at most one entity in A. Example: a department has many students, but each student belongs to one department.',
                                'Many-to-Many (M:N) — each entity in A can be associated with many entities in B, and vice versa. Example: students can enroll in many courses, and each course can have many students.',
                            ]),
                            $this->p([
                                $this->bold('Participation constraints'),
                                $this->text(' specify whether all entities must participate in the relationship (total participation) or participation is optional (partial). For example, if every employee must work in a department, the participation of Employee in the "works_in" relationship is total.'),
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Enhanced ER Features',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Specialization and Generalization',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->bold('Specialization'),
                                $this->text(' is the process of defining subclasses of an entity type based on distinguishing characteristics. For example, the entity type EMPLOYEE can be specialized into SECRETARY, TECHNICIAN, and ENGINEER based on the job type attribute. Each subclass inherits all attributes and relationships of the parent class and may have additional attributes of its own.'),
                            ]),
                            $this->p([
                                $this->bold('Generalization'),
                                $this->text(' is the reverse process — combining two or more entity types that share common attributes into a higher-level entity type. For example, CAR and TRUCK entities might be generalized into a VEHICLE entity type.'),
                            ]),
                            $this->p('Specialization can be disjoint (an entity belongs to at most one subclass) or overlapping (an entity can belong to multiple subclasses). It can also be total (every entity in the superclass must belong to some subclass) or partial (an entity may not belong to any subclass).'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'ER to Relational Mapping',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Mapping Algorithm',
                        'type' => 'text',
                        'readTime' => 5,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Converting an ER diagram to a relational schema follows a systematic algorithm:'),
                            $this->ol([
                                'Regular entity types: Create a table for each strong entity type. Include all simple attributes. Choose one key attribute as the primary key. For composite attributes, include only the simple component attributes.',
                                'Weak entity types: Create a table that includes all simple attributes of the weak entity. Include the primary key of the owner entity as a foreign key. The primary key of the weak entity table is the combination of this foreign key and the partial key of the weak entity.',
                                'Binary 1:1 relationships: Add the primary key of one side as a foreign key in the other. Prefer the side with total participation to hold the FK.',
                                'Binary 1:N relationships: Add the primary key of the "1" side as a foreign key in the "N" side table.',
                                'Binary M:N relationships: Create a new table (junction/associative table) with the primary keys of both participating entities as foreign keys. The combination of these foreign keys forms the primary key. Include any relationship attributes.',
                                'Multi-valued attributes: Create a new table with a column for the attribute value and a foreign key referencing the owning entity. The primary key is the combination of both columns.',
                                'Specialization/Generalization: Multiple options exist — create a table for each subclass including the superclass primary key, or create a single table with a type discriminator column.',
                            ]),
                        ]),
                    ],
                    [
                        'title' => 'Mapping Example',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Consider a university ER diagram with STUDENT (MatricNo, Name, Level), COURSE (CourseCode, Title, CreditUnits), and an M:N ENROLLS relationship with a "Grade" attribute. The mapping produces:'),
                            $this->code("CREATE TABLE students (\n    matric_no VARCHAR(20) PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    level VARCHAR(10) NOT NULL\n);\n\nCREATE TABLE courses (\n    course_code VARCHAR(10) PRIMARY KEY,\n    title VARCHAR(200) NOT NULL,\n    credit_units INT NOT NULL\n);\n\nCREATE TABLE enrollments (\n    matric_no VARCHAR(20) REFERENCES students(matric_no),\n    course_code VARCHAR(10) REFERENCES courses(course_code),\n    grade CHAR(1),\n    PRIMARY KEY (matric_no, course_code)\n);"),
                            $this->p('The ENROLLMENTS table is the junction table for the M:N relationship. Its composite primary key ensures that a student cannot be enrolled in the same course twice. The grade attribute, which belongs to the relationship rather than either entity, is placed in this junction table.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createRelationalBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Relational Model Concepts',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Relations, Tuples, and Attributes',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('In formal relational model terminology, a relation is a mathematical concept based on set theory. A relation R defined on sets (domains) D1, D2, ..., Dn consists of a relation schema and a relation instance.'),
                            $this->ul([
                                'Relation Schema R(A1, A2, ..., An): the blueprint specifying the relation name R and a list of attributes A1 through An',
                                'Attribute: each attribute Ai is the name of a role played by some domain Di in the relation',
                                'Domain: the set of allowable values for an attribute (e.g., all valid Nigerian phone numbers)',
                                'Tuple: a single row in the relation — an ordered list of values, one for each attribute',
                                'Relation Instance: the set of tuples currently in the relation (the actual data at a given time)',
                            ]),
                            $this->p('Key properties of relations: tuples in a relation have no inherent order, no duplicate tuples are allowed, attribute values are atomic (indivisible), and NULL represents an unknown or inapplicable value.'),
                        ]),
                    ],
                    [
                        'title' => 'Keys and Constraints',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('Constraints are rules that restrict the values that can be stored in a database. Key types of keys and constraints in the relational model:'),
                            $this->ul([
                                'Superkey — a set of attributes that uniquely identifies each tuple. {MatricNo, Name, Level} is a superkey for STUDENT because MatricNo alone is unique.',
                                'Candidate Key — a minimal superkey (no proper subset is also a superkey). If both MatricNo and Email are unique, both are candidate keys.',
                                'Primary Key — the candidate key chosen by the database designer to be the principal means of identifying tuples. Shown underlined in schema notation.',
                                'Foreign Key — an attribute (or set of attributes) in one relation that references the primary key of another relation. It establishes a link between relations.',
                                'NOT NULL — specifies that an attribute cannot have a null value.',
                                'UNIQUE — ensures all values in an attribute (or combination) are distinct.',
                                'CHECK — defines a condition that each row must satisfy.',
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Relational Algebra',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Fundamental Operations',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Relational algebra is a procedural query language consisting of operations that take one or two relations as input and produce a new relation as output. The six fundamental operations are:'),
                            $this->ol([
                                'SELECT (σ) — filters rows that satisfy a given condition. σ(Level="300")(STUDENT) returns all 300-level students.',
                                'PROJECT (π) — selects specific columns, removing duplicates. π(Name, Level)(STUDENT) returns only names and levels.',
                                'UNION (∪) — combines tuples from two union-compatible relations, removing duplicates.',
                                'SET DIFFERENCE (−) — returns tuples in the first relation that are not in the second.',
                                'CARTESIAN PRODUCT (×) — combines every tuple from the first relation with every tuple from the second.',
                                'RENAME (ρ) — renames a relation or its attributes.',
                            ]),
                            $this->p('These six operations are sufficient to express any relational query. Additional operations like JOIN, INTERSECTION, and DIVISION are defined for convenience but can be derived from the fundamentals.'),
                        ]),
                    ],
                    [
                        'title' => 'Join Operations',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Join operations combine related tuples from two relations. They are the most commonly used operations in practice:'),
                            $this->ul([
                                'Theta Join (⋈θ) — combines tuples satisfying condition θ. Equivalent to selecting from a Cartesian product.',
                                'Equi-Join — a theta join where the condition uses only equality (=).',
                                'Natural Join (⋈) — an equi-join on all common attribute names, with duplicate columns removed. The most common join type.',
                                'Left Outer Join (⟕) — preserves all tuples from the left relation, padding with NULLs where no match exists on the right.',
                                'Right Outer Join (⟖) — preserves all tuples from the right relation.',
                                'Full Outer Join (⟗) — preserves all tuples from both relations.',
                            ]),
                            $this->p('Understanding join operations is essential for writing SQL queries, as most real-world queries involve combining data from multiple tables.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Relational Integrity',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Integrity Rules',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('Two fundamental integrity rules govern all relational databases:'),
                            $this->p([
                                $this->bold('Entity Integrity Rule'),
                                $this->text(': No primary key attribute may have a NULL value. This is because the primary key is used to identify individual tuples — if it were NULL, we could not distinguish some tuples from others. Every table must have a primary key, and every primary key value must be unique and non-null.'),
                            ]),
                            $this->p([
                                $this->bold('Referential Integrity Rule'),
                                $this->text(': A foreign key value must either match a primary key value in the referenced relation or be NULL (if the foreign key is allowed to be null). This ensures that relationships between tables remain consistent — you cannot reference a row that does not exist.'),
                            ]),
                            $this->p('When a referenced row is deleted or updated, the DBMS can take several actions: RESTRICT (reject the operation), CASCADE (propagate the change), SET NULL (set the foreign key to NULL), or SET DEFAULT (set to a default value). These actions are specified in the foreign key constraint definition.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createSQLBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Data Definition Language',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'CREATE, ALTER, and DROP Statements',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('DDL statements define and modify the database structure:'),
                            $this->code("-- Creating a table with constraints\nCREATE TABLE students (\n    matric_no VARCHAR(20) PRIMARY KEY,\n    first_name VARCHAR(50) NOT NULL,\n    last_name VARCHAR(50) NOT NULL,\n    email VARCHAR(100) UNIQUE,\n    date_of_birth DATE,\n    department_id INT REFERENCES departments(id),\n    level INT CHECK (level IN (100, 200, 300, 400, 500)),\n    gpa DECIMAL(3,2) DEFAULT 0.00,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Adding a new column\nALTER TABLE students ADD COLUMN phone VARCHAR(15);\n\n-- Modifying a column type\nALTER TABLE students ALTER COLUMN email TYPE VARCHAR(150);\n\n-- Adding a constraint after table creation\nALTER TABLE students ADD CONSTRAINT chk_gpa\n    CHECK (gpa >= 0.00 AND gpa <= 5.00);\n\n-- Removing a table and all its data\nDROP TABLE students CASCADE;"),
                            $this->p('The CASCADE option in DROP TABLE also removes dependent objects (views, foreign keys referencing this table). Use with caution. RESTRICT (the default in most DBMS) prevents deletion if dependent objects exist.'),
                        ]),
                    ],
                    [
                        'title' => 'Data Types and Constraints',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('SQL provides a rich set of data types for different kinds of data:'),
                            $this->ul([
                                'Character: CHAR(n) — fixed-length, VARCHAR(n) — variable-length, TEXT — unlimited length',
                                'Numeric: INTEGER/INT, SMALLINT, BIGINT, DECIMAL(p,s)/NUMERIC(p,s) for exact decimals, FLOAT/REAL/DOUBLE PRECISION for approximate',
                                'Date/Time: DATE (date only), TIME (time only), TIMESTAMP (both), INTERVAL (duration)',
                                'Boolean: BOOLEAN — TRUE, FALSE, or NULL',
                                'Binary: BYTEA (PostgreSQL) / BLOB (MySQL/Oracle) for binary data',
                                'JSON: JSON/JSONB for semi-structured data (PostgreSQL, MySQL 5.7+)',
                            ]),
                            $this->p('Column constraints include NOT NULL, UNIQUE, PRIMARY KEY, REFERENCES (foreign key), CHECK (condition), and DEFAULT (value). Table constraints can reference multiple columns, such as composite primary keys and multi-column CHECK constraints.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Data Manipulation Language',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'SELECT Queries',
                        'type' => 'text',
                        'readTime' => 5,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('The SELECT statement is the most frequently used SQL command. Its general structure is:'),
                            $this->code("SELECT [DISTINCT] column_list\nFROM table_list\n[WHERE condition]\n[GROUP BY column_list]\n[HAVING group_condition]\n[ORDER BY column_list [ASC|DESC]]\n[LIMIT count OFFSET start];"),
                            $this->p('Practical examples using a university database:'),
                            $this->code("-- All students in Computer Science, sorted by name\nSELECT matric_no, first_name, last_name, level\nFROM students\nWHERE department_id = 5\nORDER BY last_name, first_name;\n\n-- Students with GPA above 4.0 in 300 level\nSELECT first_name, last_name, gpa\nFROM students\nWHERE gpa > 4.0 AND level = 300;\n\n-- Distinct departments that have students\nSELECT DISTINCT department_id\nFROM students;\n\n-- Pattern matching with LIKE\nSELECT * FROM students\nWHERE first_name LIKE 'Chi%';  -- Names starting with Chi"),
                            $this->p('The WHERE clause supports comparison operators (=, <>, <, >, <=, >=), logical operators (AND, OR, NOT), range testing (BETWEEN), set membership (IN), null testing (IS NULL, IS NOT NULL), and pattern matching (LIKE with % and _ wildcards).'),
                        ]),
                        'simplified' => $this->doc([
                            $this->p('SELECT is how you ask a database a question. Think of it like telling the database: "Show me this information, from this table, where these conditions are met."'),
                            $this->code("-- Show me all 300-level students\nSELECT * FROM students WHERE level = 300;\n\n-- Just their names and GPAs, sorted best first\nSELECT first_name, gpa\nFROM students\nWHERE level = 300\nORDER BY gpa DESC;"),
                            $this->p('The * means "all columns." WHERE filters rows. ORDER BY sorts the results. It is like telling someone: "From the student register, find everyone in 300 level, and list them from highest to lowest GPA."'),
                        ]),
                    ],
                    [
                        'title' => 'INSERT, UPDATE, and DELETE',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Data modification statements change the content of tables:'),
                            $this->code("-- INSERT: adding new rows\nINSERT INTO students (matric_no, first_name, last_name, level)\nVALUES ('MOUAU/CS/20/1001', 'Chinedu', 'Okafor', 300);\n\n-- INSERT multiple rows\nINSERT INTO enrollments (matric_no, course_code, semester)\nVALUES\n    ('MOUAU/CS/20/1001', 'CSC 302', 'first'),\n    ('MOUAU/CS/20/1001', 'CSC 301', 'first');\n\n-- UPDATE: modifying existing rows\nUPDATE students\nSET level = 400, gpa = 4.25\nWHERE matric_no = 'MOUAU/CS/20/1001';\n\n-- DELETE: removing rows\nDELETE FROM enrollments\nWHERE matric_no = 'MOUAU/CS/20/1001'\nAND course_code = 'CSC 302';"),
                            $this->p([
                                $this->bold('Warning'),
                                $this->text(': UPDATE and DELETE without a WHERE clause affect ALL rows in the table. Always double-check your WHERE clause before executing these statements. Many organizations require transactions around modification statements so changes can be rolled back if something goes wrong.'),
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Joins and Subqueries',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Types of Joins',
                        'type' => 'text',
                        'readTime' => 5,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Joins combine rows from two or more tables based on related columns:'),
                            $this->code("-- INNER JOIN: only matching rows from both tables\nSELECT s.first_name, s.last_name, d.name AS department\nFROM students s\nINNER JOIN departments d ON s.department_id = d.id;\n\n-- LEFT JOIN: all students, even those without a department\nSELECT s.first_name, d.name AS department\nFROM students s\nLEFT JOIN departments d ON s.department_id = d.id;\n\n-- Multiple joins: students with their courses and grades\nSELECT s.matric_no, s.first_name, c.course_code,\n       c.title, e.grade\nFROM students s\nJOIN enrollments e ON s.matric_no = e.matric_no\nJOIN courses c ON e.course_code = c.course_code\nWHERE s.level = 300\nORDER BY s.last_name, c.course_code;\n\n-- SELF JOIN: finding students in the same department\nSELECT a.first_name AS student1, b.first_name AS student2\nFROM students a\nJOIN students b ON a.department_id = b.department_id\nWHERE a.matric_no < b.matric_no;"),
                            $this->p('INNER JOIN is the default and most common — it returns only rows where the join condition is satisfied in both tables. LEFT JOIN preserves all rows from the left table, filling NULLs where no right-side match exists. RIGHT JOIN does the opposite. FULL OUTER JOIN preserves unmatched rows from both sides.'),
                        ]),
                    ],
                    [
                        'title' => 'Subqueries',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('A subquery is a SELECT statement nested inside another statement. Subqueries can appear in WHERE, FROM, SELECT, and HAVING clauses:'),
                            $this->code("-- Scalar subquery: students with above-average GPA\nSELECT first_name, last_name, gpa\nFROM students\nWHERE gpa > (SELECT AVG(gpa) FROM students);\n\n-- IN subquery: students enrolled in CSC 302\nSELECT first_name, last_name\nFROM students\nWHERE matric_no IN (\n    SELECT matric_no FROM enrollments\n    WHERE course_code = 'CSC 302'\n);\n\n-- EXISTS subquery: departments that have students\nSELECT d.name\nFROM departments d\nWHERE EXISTS (\n    SELECT 1 FROM students s\n    WHERE s.department_id = d.id\n);\n\n-- Correlated subquery: each student's rank in dept\nSELECT s.first_name, s.gpa,\n    (SELECT COUNT(*) + 1 FROM students s2\n     WHERE s2.department_id = s.department_id\n     AND s2.gpa > s.gpa) AS dept_rank\nFROM students s;"),
                            $this->p('Correlated subqueries reference columns from the outer query and are re-evaluated for each row of the outer query. While powerful, they can be slow — often a JOIN achieves the same result more efficiently.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Aggregation and Grouping',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Aggregate Functions and GROUP BY',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Aggregate functions compute a single value from a set of rows:'),
                            $this->code("-- Basic aggregates\nSELECT\n    COUNT(*) AS total_students,\n    AVG(gpa) AS average_gpa,\n    MAX(gpa) AS highest_gpa,\n    MIN(gpa) AS lowest_gpa\nFROM students\nWHERE level = 300;\n\n-- GROUP BY: aggregates per group\nSELECT department_id,\n    COUNT(*) AS num_students,\n    ROUND(AVG(gpa), 2) AS avg_gpa\nFROM students\nGROUP BY department_id\nORDER BY avg_gpa DESC;\n\n-- HAVING: filter groups (not rows)\nSELECT course_code,\n    COUNT(*) AS enrolled\nFROM enrollments\nGROUP BY course_code\nHAVING COUNT(*) > 50\nORDER BY enrolled DESC;\n\n-- Combining WHERE and HAVING\nSELECT department_id, level,\n    COUNT(*) AS count,\n    AVG(gpa) AS avg_gpa\nFROM students\nWHERE level >= 300\nGROUP BY department_id, level\nHAVING AVG(gpa) > 3.5;"),
                            $this->p('WHERE filters individual rows before grouping. HAVING filters groups after aggregation. A common mistake is putting aggregate conditions in WHERE instead of HAVING — remember: WHERE cannot contain aggregate functions.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createNormalizationBlocks(CanonicalTopic $topic): void
    {
        ContentBlock::where('canonical_topic_id', $topic->id)->delete();

        $this->createBlocks($topic->id, [
            [
                'title' => 'Functional Dependencies',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Definition and Properties',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A '),
                                $this->bold('functional dependency (FD)'),
                                $this->text(' X → Y means that the values of attribute set Y are determined by the values of attribute set X. If two tuples have the same value of X, they must have the same value of Y. For example, in a STUDENT relation, MatricNo → Name means that knowing a student\'s matric number uniquely determines their name.'),
                            ]),
                            $this->p([
                                $this->bold("Armstrong's Axioms"),
                                $this->text(' provide rules for inferring all FDs from a given set:'),
                            ]),
                            $this->ul([
                                'Reflexivity — if Y ⊆ X, then X → Y (a set of attributes always determines its subset)',
                                'Augmentation — if X → Y, then XZ → YZ (adding attributes to both sides preserves the dependency)',
                                'Transitivity — if X → Y and Y → Z, then X → Z (dependencies are transitive)',
                            ]),
                            $this->p('Additional derived rules include Union (if X → Y and X → Z, then X → YZ), Decomposition (if X → YZ, then X → Y and X → Z), and Pseudotransitivity (if X → Y and WY → Z, then WX → Z).'),
                        ]),
                    ],
                    [
                        'title' => 'Closure and Candidate Keys',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('The '),
                                $this->bold('closure of attribute set X'),
                                $this->text(' (written X⁺) is the set of all attributes functionally determined by X. To compute X⁺, start with X and repeatedly add attributes that are functionally determined by attributes already in the closure.'),
                            ]),
                            $this->p('Example: Given FDs {A → B, B → C, A → D}, the closure of {A} is: start with {A}, add B (since A → B), add D (since A → D), add C (since B → C). So A⁺ = {A, B, C, D}.'),
                            $this->p([
                                $this->text('A '),
                                $this->bold('candidate key'),
                                $this->text(' K is a set of attributes whose closure K⁺ contains all attributes of the relation, and no proper subset of K has this property. Finding candidate keys is essential for normalization — you compute closures of all possible attribute combinations to identify the minimal sets that determine everything.'),
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Normal Forms',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'First Normal Form (1NF)',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A relation is in '),
                                $this->bold('First Normal Form'),
                                $this->text(' if every attribute contains only atomic (indivisible) values — no repeating groups, no multi-valued attributes, and no nested relations. Each column holds exactly one value per row.'),
                            ]),
                            $this->p('Violation example — a STUDENT_COURSES table where one column stores multiple course codes separated by commas:'),
                            $this->code("-- NOT in 1NF (multi-valued column)\n| MatricNo | Name    | Courses              |\n|----------|---------|----------------------|\n| 001      | Amaka   | CSC301, CSC302       |\n| 002      | Emeka   | CSC302, CSC303, MTH301|\n\n-- Converted to 1NF (one value per cell)\n| MatricNo | Name    | Course |\n|----------|---------|--------|\n| 001      | Amaka   | CSC301 |\n| 001      | Amaka   | CSC302 |\n| 002      | Emeka   | CSC302 |\n| 002      | Emeka   | CSC303 |\n| 002      | Emeka   | MTH301 |"),
                            $this->p('While the 1NF version has more rows, it enables proper querying. You can now easily answer "How many students take CSC302?" with a simple COUNT.'),
                        ]),
                        'simplified' => $this->doc([
                            $this->p('First Normal Form means: every cell in your table should have exactly ONE value, not a list of values.'),
                            $this->p('Bad example: Storing "CSC301, CSC302, CSC303" in one cell. Good example: Creating one row for each course. Think of it like this — if you tried to put three phone numbers in one contact field on your phone, searching and sorting would be a mess. Same thing with databases.'),
                        ]),
                    ],
                    [
                        'title' => 'Second Normal Form (2NF)',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A relation is in '),
                                $this->bold('Second Normal Form'),
                                $this->text(' if it is in 1NF and every non-key attribute is '),
                                $this->bold('fully functionally dependent'),
                                $this->text(' on the entire primary key. This means no non-key attribute depends on just a part of a composite primary key.'),
                            ]),
                            $this->p('Example of a 2NF violation:'),
                            $this->code("-- Table: ENROLLMENT (MatricNo, CourseCode, Grade, CourseTitle)\n-- Primary Key: (MatricNo, CourseCode)\n-- FDs: MatricNo, CourseCode → Grade\n--      CourseCode → CourseTitle  ← PARTIAL DEPENDENCY!\n\n-- CourseTitle depends only on CourseCode,\n-- not on the full key (MatricNo, CourseCode)\n\n-- Fix: Decompose into two tables\n-- ENROLLMENT(MatricNo, CourseCode, Grade)\n-- COURSE(CourseCode, CourseTitle)"),
                            $this->p('2NF violations only occur in tables with composite primary keys. If a table has a single-column primary key, it is automatically in 2NF (provided it is in 1NF).'),
                        ]),
                    ],
                    [
                        'title' => 'Third Normal Form (3NF)',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A relation is in '),
                                $this->bold('Third Normal Form'),
                                $this->text(' if it is in 2NF and no non-key attribute is '),
                                $this->bold('transitively dependent'),
                                $this->text(' on the primary key. A transitive dependency occurs when A → B and B → C, so A → C through B.'),
                            ]),
                            $this->p('Example of a 3NF violation:'),
                            $this->code("-- Table: STUDENT(MatricNo, Name, DeptId, DeptName, DeptHOD)\n-- PK: MatricNo\n-- FDs: MatricNo → DeptId\n--      DeptId → DeptName   ← TRANSITIVE!\n--      DeptId → DeptHOD    ← TRANSITIVE!\n\n-- DeptName and DeptHOD depend on MatricNo\n-- THROUGH DeptId (transitive dependency)\n\n-- Fix: Decompose\n-- STUDENT(MatricNo, Name, DeptId)\n-- DEPARTMENT(DeptId, DeptName, DeptHOD)"),
                            $this->p('The problem with transitive dependencies is update anomalies: if the HOD of a department changes, you would have to update it in every student row. With 3NF, you update it in one place — the DEPARTMENT table.'),
                        ]),
                    ],
                    [
                        'title' => 'Boyce-Codd Normal Form (BCNF)',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'advanced',
                        'bloom' => 'analyze',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A relation is in '),
                                $this->bold('BCNF'),
                                $this->text(' if for every non-trivial functional dependency X → Y, X is a superkey. BCNF is strictly stronger than 3NF — every BCNF relation is in 3NF, but not vice versa.'),
                            ]),
                            $this->p('BCNF and 3NF differ only when a relation has multiple overlapping candidate keys. Example: Consider TEACHING(Student, Course, Instructor) where each student takes one instructor per course, and each instructor teaches only one course:'),
                            $this->code("-- FDs: Student, Course → Instructor\n--      Instructor → Course\n-- Candidate Keys: {Student, Course} and {Student, Instructor}\n\n-- Instructor → Course violates BCNF because\n-- Instructor is not a superkey.\n-- But it doesn't violate 3NF because Course\n-- is part of a candidate key.\n\n-- BCNF Decomposition:\n-- TEACHES(Instructor, Course)\n-- TAKES(Student, Instructor)"),
                            $this->p('In practice, most 3NF relations are also in BCNF. The cases where they differ are relatively rare but important to recognize.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Denormalization',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'When and Why to Denormalize',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'evaluate',
                        'content' => $this->doc([
                            $this->p('While normalization eliminates redundancy and prevents anomalies, highly normalized databases can suffer from performance problems due to the many joins required to reconstruct related data. Denormalization is the deliberate introduction of controlled redundancy to improve read performance.'),
                            $this->p('Common denormalization strategies include:'),
                            $this->ul([
                                'Storing derived/computed values (e.g., keeping a total_credits column in STUDENT instead of calculating it from enrollments each time)',
                                'Duplicating columns from related tables (e.g., storing department_name in the STUDENT table alongside department_id)',
                                'Pre-joining tables (combining frequently joined tables into one)',
                                'Summary tables (materialized aggregates for reporting)',
                            ]),
                            $this->p('The decision to denormalize should be based on measured performance data, not guesswork. Always start with a properly normalized design and denormalize only specific areas where benchmarks show it is needed. Remember: denormalization trades write complexity (keeping redundant data consistent) for read performance.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createAdvancedSQLBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Advanced SQL Features',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Views and Stored Procedures',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'advanced',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A '),
                                $this->bold('view'),
                                $this->text(' is a virtual table defined by a stored query. Views do not store data themselves — they execute their defining query each time they are referenced:'),
                            ]),
                            $this->code("-- View: active students with department info\nCREATE VIEW active_students AS\nSELECT s.matric_no, s.first_name, s.last_name,\n       d.name AS department, s.level, s.gpa\nFROM students s\nJOIN departments d ON s.department_id = d.id\nWHERE s.level IS NOT NULL;\n\n-- Using the view like a table\nSELECT * FROM active_students\nWHERE department = 'Computer Science'\nORDER BY gpa DESC;"),
                            $this->p([
                                $this->bold('Stored procedures'),
                                $this->text(' are named blocks of SQL code stored in the database and executed on the server. They reduce network traffic and centralize business logic:'),
                            ]),
                            $this->code("-- Procedure to enroll a student\nCREATE OR REPLACE PROCEDURE enroll_student(\n    p_matric VARCHAR, p_course VARCHAR\n)\nLANGUAGE plpgsql AS $$\nBEGIN\n    INSERT INTO enrollments (matric_no, course_code)\n    VALUES (p_matric, p_course);\n\n    UPDATE students\n    SET total_courses = total_courses + 1\n    WHERE matric_no = p_matric;\nEND;\n$$;\n\nCALL enroll_student('MOUAU/CS/20/1001', 'CSC 302');"),
                        ]),
                    ],
                    [
                        'title' => 'Triggers',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'advanced',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('A trigger is a stored procedure that automatically executes in response to specific events on a table (INSERT, UPDATE, DELETE). Triggers enforce complex integrity constraints and maintain derived data:'),
                            $this->code("-- Trigger: automatically update GPA when grade changes\nCREATE OR REPLACE FUNCTION update_student_gpa()\nRETURNS TRIGGER AS $$\nBEGIN\n    UPDATE students\n    SET gpa = (\n        SELECT ROUND(AVG(\n            CASE grade\n                WHEN 'A' THEN 5.0 WHEN 'B' THEN 4.0\n                WHEN 'C' THEN 3.0 WHEN 'D' THEN 2.0\n                WHEN 'E' THEN 1.0 ELSE 0.0\n            END\n        ), 2)\n        FROM enrollments\n        WHERE matric_no = NEW.matric_no\n        AND grade IS NOT NULL\n    )\n    WHERE matric_no = NEW.matric_no;\n    RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\nCREATE TRIGGER trg_grade_update\nAFTER UPDATE OF grade ON enrollments\nFOR EACH ROW\nEXECUTE FUNCTION update_student_gpa();"),
                            $this->p('Use triggers judiciously — they execute implicitly and can make debugging difficult. They are best suited for maintaining audit trails, enforcing cross-table constraints, and automatically computing derived values.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Query Optimization',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Query Processing and Optimization',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'advanced',
                        'bloom' => 'analyze',
                        'content' => $this->doc([
                            $this->p('When you submit a SQL query, the DBMS processes it through several stages: parsing (checking syntax), validation (checking semantics and permissions), optimization (finding the best execution plan), and execution.'),
                            $this->p('The query optimizer considers multiple execution strategies and selects the most efficient one based on cost estimates. Key optimization techniques include:'),
                            $this->ul([
                                'Predicate pushdown — applying WHERE filters as early as possible to reduce intermediate result sizes',
                                'Join ordering — choosing the sequence of joins to minimize intermediate results',
                                'Index selection — choosing whether to use available indexes or perform table scans',
                                'Join algorithm selection — nested loop, hash join, or merge join based on data sizes',
                            ]),
                            $this->p('The EXPLAIN command reveals the optimizer\'s chosen plan:'),
                            $this->code("EXPLAIN ANALYZE\nSELECT s.first_name, c.title, e.grade\nFROM students s\nJOIN enrollments e ON s.matric_no = e.matric_no\nJOIN courses c ON e.course_code = c.course_code\nWHERE s.level = 300;"),
                            $this->p('Understanding query plans helps you write more efficient queries and create appropriate indexes for your workload.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createTransactionBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Transaction Concepts',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'ACID Properties',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'advanced',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A '),
                                $this->bold('transaction'),
                                $this->text(' is a logical unit of work that must be executed atomically — either completely or not at all. Transactions must satisfy four properties, known by the acronym ACID:'),
                            ]),
                            $this->ul([
                                'Atomicity — a transaction is an indivisible unit. Either all its operations are reflected in the database, or none are. If a bank transfer debits one account but the system crashes before crediting another, the entire transaction is rolled back.',
                                'Consistency — a transaction brings the database from one consistent state to another. All integrity constraints must be satisfied after the transaction completes. For example, the total balance across all accounts should remain the same after a transfer.',
                                'Isolation — each transaction executes as if it were the only transaction in the system. Intermediate states of a transaction are not visible to other concurrent transactions.',
                                'Durability — once a transaction is committed, its effects persist even in the event of system failure. Committed data is written to non-volatile storage.',
                            ]),
                            $this->code("BEGIN TRANSACTION;\n\n-- Transfer ₦50,000 from Account A to Account B\nUPDATE accounts SET balance = balance - 50000\nWHERE account_id = 'A';\n\nUPDATE accounts SET balance = balance + 50000\nWHERE account_id = 'B';\n\n-- If both succeed:\nCOMMIT;\n\n-- If anything fails:\n-- ROLLBACK;"),
                        ]),
                        'simplified' => $this->doc([
                            $this->p('Think of a transaction like a promise: "Either everything I am about to do will happen, or nothing will." It is like transferring money between two bank accounts — you would never want the money to leave one account without arriving in the other.'),
                            $this->p('ACID is an easy way to remember the four rules: Atomicity (all or nothing), Consistency (no broken rules), Isolation (transactions don\'t interfere), Durability (saved means saved forever, even if the power goes out).'),
                        ]),
                    ],
                    [
                        'title' => 'Transaction States',
                        'type' => 'text',
                        'readTime' => 2,
                        'difficulty' => 'intermediate',
                        'bloom' => 'remember',
                        'content' => $this->doc([
                            $this->p('A transaction passes through several states during its lifetime:'),
                            $this->ol([
                                'Active — the initial state. The transaction stays in this state while it is executing its operations.',
                                'Partially Committed — after the final statement has been executed. The transaction has completed its operations but the results may not yet be permanently stored.',
                                'Committed — after successful completion and the changes have been permanently saved to disk. The transaction cannot be rolled back after this point.',
                                'Failed — after the discovery that normal execution can no longer proceed (due to a hardware or logical error).',
                                'Aborted — after the transaction has been rolled back and the database has been restored to its state before the transaction started. The system may either restart or kill the transaction.',
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Concurrency Control',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Concurrency Problems',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'advanced',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('When multiple transactions execute concurrently without proper control, several anomalies can occur:'),
                            $this->ul([
                                'Lost Update — two transactions read the same data and then update it based on their read values. One update overwrites the other. Example: two clerks reading a balance of ₦100,000, both adding ₦10,000 — final balance is ₦110,000 instead of ₦120,000.',
                                'Dirty Read — a transaction reads data written by another transaction that has not yet committed. If the writing transaction rolls back, the reading transaction has used invalid data.',
                                'Non-Repeatable Read — a transaction reads the same row twice and gets different values because another transaction modified and committed the row in between.',
                                'Phantom Read — a transaction executes the same query twice and gets a different set of rows because another transaction inserted or deleted rows that match the query condition.',
                            ]),
                            $this->p('These problems motivate the need for concurrency control mechanisms — protocols that regulate concurrent access to shared data.'),
                        ]),
                    ],
                    [
                        'title' => 'Locking and Isolation Levels',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'advanced',
                        'bloom' => 'analyze',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('The '),
                                $this->bold('Two-Phase Locking (2PL) protocol'),
                                $this->text(' is the most common concurrency control mechanism. It requires that a transaction acquires all locks before releasing any. The two phases are: Growing Phase (acquiring locks, no releases) and Shrinking Phase (releasing locks, no new acquisitions).'),
                            ]),
                            $this->p('SQL defines four isolation levels, each allowing different concurrency anomalies:'),
                            $this->code("-- READ UNCOMMITTED: allows dirty reads\nSET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;\n\n-- READ COMMITTED: prevents dirty reads (PostgreSQL default)\nSET TRANSACTION ISOLATION LEVEL READ COMMITTED;\n\n-- REPEATABLE READ: prevents dirty + non-repeatable reads\nSET TRANSACTION ISOLATION LEVEL REPEATABLE READ;\n\n-- SERIALIZABLE: prevents all anomalies (strongest)\nSET TRANSACTION ISOLATION LEVEL SERIALIZABLE;"),
                            $this->p('Higher isolation levels provide stronger consistency guarantees but reduce concurrency. Most applications use READ COMMITTED or REPEATABLE READ as a balance between consistency and performance. SERIALIZABLE provides perfect isolation but can cause transaction rollbacks due to serialization conflicts.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Recovery Techniques',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Log-Based Recovery',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'advanced',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('The '),
                                $this->bold('Write-Ahead Logging (WAL)'),
                                $this->text(' protocol is the foundation of database recovery. Before any change is written to the database, a log record describing the change must be written to stable storage. The log contains: transaction ID, data item, old value (for undo), and new value (for redo).'),
                            ]),
                            $this->p('During recovery after a crash, the system uses the log to:'),
                            $this->ul([
                                'UNDO uncommitted transactions — restore data items to their values before the transaction modified them, ensuring atomicity',
                                'REDO committed transactions — reapply changes that may not have been written to disk before the crash, ensuring durability',
                            ]),
                            $this->p([
                                $this->bold('Checkpointing'),
                                $this->text(' periodically writes all dirty pages to disk and records a checkpoint in the log. This limits the amount of log that must be processed during recovery — the system only needs to process log records after the most recent checkpoint, significantly reducing recovery time.'),
                            ]),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createIndexingBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'File Organization',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Heap and Sorted Files',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A '),
                                $this->bold('heap file'),
                                $this->text(' (unordered file) stores records in no particular order. New records are inserted at the end. Insertion is very fast (O(1)), but searching requires scanning the entire file (O(n)). Heap files are appropriate for bulk-loading data and for small tables.'),
                            ]),
                            $this->p([
                                $this->text('A '),
                                $this->bold('sorted (sequential) file'),
                                $this->text(' stores records ordered by one or more columns (the sort key). Binary search can find records in O(log n), making lookups much faster. However, insertions are expensive because records may need to be shifted to maintain order. Overflow pages are often used to defer reorganization.'),
                            ]),
                            $this->p([
                                $this->bold('Hashing'),
                                $this->text(' distributes records into buckets using a hash function on the search key. Direct lookup is O(1) for equality queries but hashing does not support range queries. Static hashing allocates a fixed number of buckets, while extendible hashing and linear hashing allow the hash space to grow dynamically.'),
                            ]),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Index Structures',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'B-Trees and B+ Trees',
                        'type' => 'text',
                        'readTime' => 5,
                        'difficulty' => 'advanced',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('The '),
                                $this->bold('B+ tree'),
                                $this->text(' is the dominant index structure in relational databases. It is a balanced tree where all leaf nodes are at the same depth, ensuring O(log n) performance for search, insert, and delete operations. Key properties:'),
                            ]),
                            $this->ul([
                                'Internal nodes store keys and child pointers — they act as signposts directing the search',
                                'Leaf nodes store key-value pairs (key → record pointer) and are linked together in a doubly-linked list',
                                'Each node is sized to fit exactly one disk page (typically 4KB-16KB)',
                                'Nodes must be at least half-full, ensuring space utilization and balanced height',
                            ]),
                            $this->p('A B+ tree with a branching factor of 200 and height 3 can index 200³ = 8 million records. Since the root and frequently accessed internal nodes are cached in memory, most lookups require only 1-2 disk reads.'),
                            $this->code("-- Creating indexes in SQL\nCREATE INDEX idx_students_dept ON students(department_id);\nCREATE INDEX idx_students_name ON students(last_name, first_name);\nCREATE UNIQUE INDEX idx_students_email ON students(email);"),
                            $this->p('Composite indexes (multi-column) support queries that filter on leading columns. The index on (last_name, first_name) efficiently supports queries filtering by last_name alone, or by both last_name and first_name, but NOT by first_name alone.'),
                        ]),
                    ],
                    [
                        'title' => 'Clustered vs Non-Clustered Indexes',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'advanced',
                        'bloom' => 'analyze',
                        'content' => $this->doc([
                            $this->p([
                                $this->text('A '),
                                $this->bold('clustered index'),
                                $this->text(' determines the physical order of data in the table. A table can have at most one clustered index. In PostgreSQL, the primary key is a unique index but the table is not automatically clustered — you must run CLUSTER explicitly.'),
                            ]),
                            $this->p([
                                $this->text('A '),
                                $this->bold('non-clustered index'),
                                $this->text(' creates a separate structure with pointers to the actual data rows. Multiple non-clustered indexes can exist on one table. Non-clustered indexes are like the index in the back of a textbook — they tell you which page to turn to, but the pages themselves are in their own order.'),
                            ]),
                            $this->p('Choosing when to create indexes:'),
                            $this->ul([
                                'Create indexes on columns used frequently in WHERE clauses and JOIN conditions',
                                'Create indexes on foreign key columns (this significantly speeds up joins)',
                                'Avoid indexing columns with low selectivity (e.g., a gender column with only 2 values)',
                                'Avoid over-indexing — each index slows down INSERT, UPDATE, and DELETE operations because the index must also be maintained',
                            ]),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    private function createSecurityBlocks(CanonicalTopic $topic): void
    {
        $this->createBlocks($topic->id, [
            [
                'title' => 'Database Security',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Access Control and Privileges',
                        'type' => 'text',
                        'readTime' => 4,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p('Database security involves protecting the database against intentional or accidental threats. The primary mechanism is access control through the SQL GRANT and REVOKE commands:'),
                            $this->code("-- Grant specific privileges\nGRANT SELECT, INSERT ON students TO registrar_role;\nGRANT SELECT ON active_students TO lecturer_role;\nGRANT ALL PRIVILEGES ON enrollments TO admin;\n\n-- Grant with ability to pass on privileges\nGRANT SELECT ON students TO dept_head\nWITH GRANT OPTION;\n\n-- Revoke privileges\nREVOKE INSERT ON students FROM registrar_role;\nREVOKE ALL PRIVILEGES ON students FROM intern;"),
                            $this->p([
                                $this->bold('Role-Based Access Control (RBAC)'),
                                $this->text(' groups privileges into roles that are assigned to users. Instead of granting permissions to each user individually, you create roles (like "lecturer", "registrar", "student") and grant appropriate permissions to each role. Users are then assigned to roles. This simplifies administration greatly in large organizations.'),
                            ]),
                        ]),
                    ],
                    [
                        'title' => 'SQL Injection Prevention',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'apply',
                        'content' => $this->doc([
                            $this->p([
                                $this->bold('SQL injection'),
                                $this->text(' is a code injection technique where malicious SQL is inserted into application queries through user input. It is one of the most common and dangerous web application vulnerabilities.'),
                            ]),
                            $this->code("-- VULNERABLE: concatenating user input directly\nquery = \"SELECT * FROM students WHERE matric_no = '\" + user_input + \"'\";\n-- If user enters: ' OR '1'='1\n-- Becomes: SELECT * FROM students WHERE matric_no = '' OR '1'='1'\n-- Returns ALL students!\n\n-- SAFE: using parameterized queries\nquery = \"SELECT * FROM students WHERE matric_no = $1\";\n-- The DBMS treats $1 as a literal value, not SQL code"),
                            $this->p('Prevention measures include: always use parameterized queries (prepared statements), validate and sanitize all user input, apply the principle of least privilege (application database accounts should only have the minimum permissions needed), and use an ORM framework that handles parameterization automatically.'),
                        ]),
                    ],
                ],
            ],
            [
                'title' => 'Database Administration',
                'type' => 'container',
                'children' => [
                    [
                        'title' => 'Backup and Recovery Strategies',
                        'type' => 'text',
                        'readTime' => 3,
                        'difficulty' => 'intermediate',
                        'bloom' => 'understand',
                        'content' => $this->doc([
                            $this->p('A robust backup strategy is essential for any production database. Common approaches include:'),
                            $this->ul([
                                'Full Backup — a complete copy of the entire database. Provides the simplest recovery but requires the most storage and time. Typically performed weekly or daily.',
                                'Incremental Backup — captures only changes since the last backup (full or incremental). Fast to create but recovery requires the last full backup plus all subsequent incrementals.',
                                'Differential Backup — captures all changes since the last full backup. Larger than incrementals but simpler to restore (only need the last full + last differential).',
                                'Continuous Archiving (WAL Archiving) — copies write-ahead log files to a separate location, enabling point-in-time recovery to any moment. Used by PostgreSQL and most enterprise DBMS.',
                            ]),
                            $this->p('Best practices include testing restores regularly (an untested backup is not a backup), storing backups off-site or in a different cloud region, encrypting backup files, and documenting the recovery procedure so it can be followed under pressure.'),
                        ]),
                    ],
                ],
            ],
        ]);
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function createQuestionPaper(array $topics): void
    {
        $paper = QuestionPaper::create([
            'institution_course_id' => $this->courseId,
            'title' => 'CSC 302 First Semester Examination 2023/2024',
            'academic_session' => '2023/2024',
            'semester' => 'First Semester',
            'year' => 2024,
            'total_marks' => 60,
            'duration_minutes' => 120,
            'instructions' => 'Answer ALL questions in Section A and any TWO questions from Section B. No electronic devices permitted.',
            'is_published' => true,
        ]);

        $sectionA = QuestionSection::create([
            'question_paper_id' => $paper->id,
            'label' => 'Section A',
            'instruction' => 'Answer ALL questions. Each question carries 2 marks.',
            'marks' => 20,
            'sort_order' => 1,
        ]);

        $sectionB = QuestionSection::create([
            'question_paper_id' => $paper->id,
            'label' => 'Section B',
            'instruction' => 'Answer any TWO questions from this section. Each question carries 20 marks.',
            'marks' => 40,
            'required_count' => 2,
            'sort_order' => 2,
        ]);

        $this->createMcqQuestions($paper, $sectionA, $topics);
        $this->createTheoryQuestions($paper, $sectionB, $topics);
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function createMcqQuestions(QuestionPaper $paper, QuestionSection $section, array $topics): void
    {
        $mcqs = [
            [
                'content' => 'Which of the following is NOT an advantage of a database system over a file-processing system?',
                'topic' => 'intro',
                'options' => [
                    ['label' => 'A', 'content' => 'Data redundancy control', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Data independence', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'Faster execution for all types of queries', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'Concurrent access support', 'is_correct' => false],
                ],
                'answer' => 'C. Database systems may actually be slower than file systems for some simple queries due to DBMS overhead. The advantages lie in data management features, not raw speed for every operation.',
                'deep' => 'While DBMS provides many advantages (redundancy control, integrity enforcement, concurrent access, security), the overhead of parsing SQL, optimizing queries, and managing transactions can make simple single-file operations slower than direct file access. The DBMS overhead is justified when managing complex, multi-user, multi-table operations where the file-based approach would be far more error-prone.',
            ],
            [
                'content' => 'In the three-schema architecture, which level describes how data is physically stored?',
                'topic' => 'models',
                'options' => [
                    ['label' => 'A', 'content' => 'External level', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Conceptual level', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'Internal level', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'View level', 'is_correct' => false],
                ],
                'answer' => 'C. The internal level (physical level) describes the physical storage structure — file organization, indexing, and access paths.',
                'deep' => 'The ANSI/SPARC architecture has three levels: External (individual user views), Conceptual (community view of the entire database — entities, relationships, constraints), and Internal (physical storage — how data is arranged on disk, indexes, compression). The view level is another name for the external level, making option D a deliberate distractor.',
            ],
            [
                'content' => 'A weak entity in an ER diagram is characterized by:',
                'topic' => 'er',
                'options' => [
                    ['label' => 'A', 'content' => 'Having no attributes', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Not having a key attribute of its own to uniquely identify instances', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'Participating in only one relationship', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'Having only single-valued attributes', 'is_correct' => false],
                ],
                'answer' => 'B. A weak entity has a partial key but cannot be uniquely identified without the primary key of its owner entity.',
                'deep' => 'A weak entity does have attributes (including a partial key, also called a discriminator), but it cannot form a complete primary key by itself. For example, DEPENDENT(Name, DateOfBirth) of EMPLOYEE cannot be uniquely identified without knowing which Employee it belongs to. The identifying relationship to the owner entity provides the missing key attributes. In ER diagrams, weak entities and their identifying relationships are shown with double-bordered rectangles and diamonds.',
            ],
            [
                'content' => 'Which relational algebra operation selects specific columns from a relation?',
                'topic' => 'relational',
                'options' => [
                    ['label' => 'A', 'content' => 'SELECT (σ)', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'PROJECT (π)', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'JOIN (⋈)', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'RENAME (ρ)', 'is_correct' => false],
                ],
                'answer' => 'B. PROJECT (π) selects specific attributes (columns) and removes duplicates. SELECT (σ) filters rows based on a condition.',
                'deep' => 'This is a common point of confusion because SQL uses SELECT for both row filtering and column selection. In relational algebra, σ (sigma/SELECT) filters rows, and π (pi/PROJECT) selects columns. The SQL SELECT clause corresponds to PROJECT, while SQL WHERE corresponds to SELECT. Understanding this distinction helps in query optimization — PROJECT reduces the width of intermediate results, while SELECT reduces the number of rows.',
            ],
            [
                'content' => 'What does the HAVING clause filter in a SQL query?',
                'topic' => 'sql',
                'options' => [
                    ['label' => 'A', 'content' => 'Individual rows before grouping', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Groups after aggregation', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'Columns in the result set', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'Tables in the FROM clause', 'is_correct' => false],
                ],
                'answer' => 'B. HAVING filters groups after GROUP BY and aggregation. WHERE filters individual rows before grouping.',
                'deep' => 'The SQL execution order is: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. WHERE operates on individual rows before any grouping occurs, so it cannot use aggregate functions. HAVING operates on groups after GROUP BY, so it can reference aggregate functions like COUNT, SUM, AVG. Example: "HAVING COUNT(*) > 10" keeps only groups with more than 10 members.',
            ],
            [
                'content' => 'Which normal form specifically addresses the elimination of transitive dependencies?',
                'topic' => 'normalization',
                'options' => [
                    ['label' => 'A', 'content' => '1NF', 'is_correct' => false],
                    ['label' => 'B', 'content' => '2NF', 'is_correct' => false],
                    ['label' => 'C', 'content' => '3NF', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'BCNF', 'is_correct' => false],
                ],
                'answer' => 'C. Third Normal Form (3NF) eliminates transitive dependencies of non-key attributes on the primary key.',
                'deep' => '1NF requires atomic values. 2NF eliminates partial dependencies (non-key attributes depending on part of a composite key). 3NF eliminates transitive dependencies (A → B → C where B is not a key). BCNF is stricter than 3NF — it requires that for every FD X → Y, X must be a superkey. The progression 1NF → 2NF → 3NF → BCNF removes increasingly subtle types of redundancy.',
            ],
            [
                'content' => 'In a B+ tree index, where are the actual data record pointers stored?',
                'topic' => 'indexing',
                'options' => [
                    ['label' => 'A', 'content' => 'In the root node only', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'In all internal nodes', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'In the leaf nodes only', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'Distributed across all levels', 'is_correct' => false],
                ],
                'answer' => 'C. In a B+ tree, data pointers are stored only in leaf nodes. Internal nodes contain only keys and child pointers for navigation.',
                'deep' => 'This is the key difference between B-trees and B+ trees. In a B-tree, data pointers exist at every level, so a search might terminate at an internal node. In a B+ tree, all searches must reach a leaf node, but the leaves are linked together in a doubly-linked list, making range queries efficient. Since internal nodes do not store data pointers, they can hold more keys per node, resulting in a wider, shallower tree and fewer disk accesses.',
            ],
            [
                'content' => 'Which ACID property ensures that a transaction is an all-or-nothing operation?',
                'topic' => 'transactions',
                'options' => [
                    ['label' => 'A', 'content' => 'Atomicity', 'is_correct' => true],
                    ['label' => 'B', 'content' => 'Consistency', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'Isolation', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'Durability', 'is_correct' => false],
                ],
                'answer' => 'A. Atomicity ensures that either all operations of a transaction complete successfully, or none of them take effect.',
                'deep' => 'Atomicity is enforced through the transaction log (WAL — Write-Ahead Logging). Before any change is made to the database, a log record is written. If the transaction fails, the DBMS uses the log to UNDO all partial changes. Consistency ensures constraints are not violated. Isolation ensures concurrent transactions do not interfere. Durability ensures committed data survives crashes through log persistence and checkpointing.',
            ],
            [
                'content' => 'SQL injection can be prevented most effectively by:',
                'topic' => 'security',
                'options' => [
                    ['label' => 'A', 'content' => 'Using longer passwords', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Encrypting the database', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'Using parameterized queries (prepared statements)', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'Restricting database size', 'is_correct' => false],
                ],
                'answer' => 'C. Parameterized queries separate SQL code from data, making it impossible for user input to be interpreted as SQL commands.',
                'deep' => 'SQL injection works by injecting malicious SQL code through user input that is concatenated directly into queries. Parameterized queries (prepared statements) solve this by sending the query structure and data values separately to the DBMS. The DBMS compiles the query first, then binds the parameter values — user input is always treated as literal data, never as executable SQL. Additional defenses include input validation, least-privilege database accounts, and using ORM frameworks.',
            ],
            [
                'content' => 'Which type of JOIN preserves all rows from the left table, even when no matching row exists in the right table?',
                'topic' => 'sql',
                'options' => [
                    ['label' => 'A', 'content' => 'INNER JOIN', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'LEFT OUTER JOIN', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'CROSS JOIN', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'NATURAL JOIN', 'is_correct' => false],
                ],
                'answer' => 'B. LEFT OUTER JOIN returns all rows from the left table and matched rows from the right table. Non-matching right-side columns are filled with NULL.',
                'deep' => 'INNER JOIN returns only rows that have matches in both tables. LEFT OUTER JOIN preserves all left-table rows — if no right-table match exists, the right columns are NULL. This is essential when you want to see all items even if they lack related data (e.g., all students including those not enrolled in any course). CROSS JOIN produces the Cartesian product (every combination). NATURAL JOIN is an implicit equi-join on all same-named columns.',
            ],
        ];

        foreach ($mcqs as $index => $mcq) {
            $question = \App\Models\Question::create([
                'institution_course_id' => $this->courseId,
                'question_paper_id' => $paper->id,
                'question_section_id' => $section->id,
                'question_type' => QuestionType::Mcq,
                'content' => $mcq['content'],
                'marks' => 2,
                'sort_order' => $index + 1,
                'response_config' => $mcq['options'],
                'difficulty_level' => QuestionDifficulty::Medium,
                'bloom_level' => BloomLevel::Understand,
                'status' => QuestionStatus::Published,
                'is_published' => true,
                'published_at' => now(),
                'year' => 2024,
                'semester' => 'first',
                'source' => QuestionSource::Manual,
                'created_by' => $this->contentUserId,
            ]);

            QuestionTopicLink::create([
                'question_id' => $question->id,
                'canonical_topic_id' => $topics[$mcq['topic']]->id,
                'is_primary' => true,
            ]);

            QuestionAnswer::create([
                'question_id' => $question->id,
                'depth_level' => AnswerDepthLevel::Quick,
                'content' => $this->doc([$this->p($mcq['answer'])]),
                'content_plain' => $mcq['answer'],
                'is_published' => true,
                'created_by' => $this->contentUserId,
            ]);

            QuestionAnswer::create([
                'question_id' => $question->id,
                'depth_level' => AnswerDepthLevel::DeepDive,
                'content' => $this->doc([$this->p($mcq['answer']), $this->p($mcq['deep'])]),
                'content_plain' => $mcq['answer'].' '.$mcq['deep'],
                'is_published' => true,
                'created_by' => $this->contentUserId,
            ]);
        }
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function createTheoryQuestions(QuestionPaper $paper, QuestionSection $section, array $topics): void
    {
        $theories = [
            [
                'content' => '(a) Explain the three-schema architecture of a database system, clearly describing each level. (8 marks)\n(b) Distinguish between logical data independence and physical data independence, with examples. (6 marks)\n(c) List three advantages of the database approach over file-based data management. (6 marks)',
                'topic' => 'models',
                'answer' => '(a) External level: individual user views. Conceptual level: community-wide logical structure. Internal level: physical storage details. (b) Logical independence: change conceptual schema without affecting views. Physical independence: change storage without affecting logical schema. (c) Reduced redundancy, data integrity enforcement, concurrent access control.',
                'deep' => "(a) The three-schema architecture (ANSI/SPARC) separates a database into three levels. The External Level provides customized views for different user groups — the registrar sees enrollment data, the bursar sees fee data, each from the same underlying database. The Conceptual Level describes the complete logical structure: all entities, relationships, constraints, and security policies — it is the 'single source of truth' for what data exists. The Internal Level specifies physical storage: file organization (heap vs. sorted), indexing (B+ tree, hash), compression, and buffer management.\n\n(b) Logical data independence means the conceptual schema can change (e.g., adding a new column, splitting a table) without requiring changes to external views or application programs. Physical data independence means the internal schema can change (e.g., adding an index, moving to SSD, changing file organization) without affecting the conceptual schema.\n\n(c) Advantages: 1) Reduced redundancy through centralized data management. 2) Integrity enforcement — constraints defined once and applied everywhere. 3) Concurrent access — multiple users can safely access data simultaneously through locking and transaction mechanisms.",
            ],
            [
                'content' => "Given the following relation STUDENT_COURSE:\n\nSTUDENT_COURSE(MatricNo, StudentName, CourseCode, CourseTitle, InstructorId, InstructorName, Grade)\n\nWith functional dependencies:\nMatricNo → StudentName\nCourseCode → CourseTitle, InstructorId\nInstructorId → InstructorName\nMatricNo, CourseCode → Grade\n\n(a) Identify the candidate key(s) of this relation. (4 marks)\n(b) Show that this relation is not in 2NF and decompose it to 2NF. (8 marks)\n(c) Show that the 2NF result is not in 3NF and decompose it to 3NF. (8 marks)",
                'topic' => 'normalization',
                'answer' => '(a) Candidate key: {MatricNo, CourseCode}. (b) Not in 2NF because StudentName depends only on MatricNo (partial dependency). Decompose into STUDENT(MatricNo, StudentName), COURSE(CourseCode, CourseTitle, InstructorId, InstructorName), ENROLLMENT(MatricNo, CourseCode, Grade). (c) COURSE is not in 3NF because InstructorName depends transitively through InstructorId. Decompose COURSE into COURSE(CourseCode, CourseTitle, InstructorId) and INSTRUCTOR(InstructorId, InstructorName).',
                'deep' => "(a) The candidate key is {MatricNo, CourseCode} because its closure includes all attributes: MatricNo → StudentName, CourseCode → CourseTitle, InstructorId → InstructorName (via transitivity through CourseCode → InstructorId), and MatricNo, CourseCode → Grade.\n\n(b) 2NF violations (partial dependencies on composite key): MatricNo → StudentName (depends on part of key), CourseCode → CourseTitle, InstructorId, InstructorName (depends on part of key). Decomposition: STUDENT(MatricNo, StudentName) with PK MatricNo; COURSE_DETAIL(CourseCode, CourseTitle, InstructorId, InstructorName) with PK CourseCode; ENROLLMENT(MatricNo, CourseCode, Grade) with PK (MatricNo, CourseCode).\n\n(c) In COURSE_DETAIL, there is a transitive dependency: CourseCode → InstructorId → InstructorName. InstructorName depends on CourseCode through InstructorId. 3NF decomposition: COURSE(CourseCode, CourseTitle, InstructorId) with PK CourseCode; INSTRUCTOR(InstructorId, InstructorName) with PK InstructorId. Final 3NF schema: STUDENT, COURSE, INSTRUCTOR, ENROLLMENT — four clean tables with no redundancy.",
            ],
            [
                'content' => "(a) Write SQL statements to create a DEPARTMENT table with columns: dept_id (integer, primary key), dept_name (varchar 100, not null, unique), faculty (varchar 100), and head_of_dept (varchar 100). (4 marks)\n(b) Write a query to find the names and GPAs of all students in the 'Computer Science' department with a GPA above 3.50, sorted by GPA in descending order. (4 marks)\n(c) Write a query that shows each department name and the number of students enrolled, including departments with no students. (6 marks)\n(d) Explain the difference between WHERE and HAVING clauses with an example. (6 marks)",
                'topic' => 'sql',
                'answer' => "(a) CREATE TABLE departments(dept_id INT PRIMARY KEY, dept_name VARCHAR(100) NOT NULL UNIQUE, faculty VARCHAR(100), head_of_dept VARCHAR(100)). (b) SELECT name, gpa FROM students JOIN departments ON ... WHERE dept_name = 'Computer Science' AND gpa > 3.50 ORDER BY gpa DESC. (c) Use LEFT JOIN with COUNT. (d) WHERE filters rows before grouping, HAVING filters groups after aggregation.",
                'deep' => "(a) CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name VARCHAR(100) NOT NULL UNIQUE, faculty VARCHAR(100), head_of_dept VARCHAR(100));\n\n(b) SELECT s.first_name || ' ' || s.last_name AS name, s.gpa FROM students s JOIN departments d ON s.department_id = d.dept_id WHERE d.dept_name = 'Computer Science' AND s.gpa > 3.50 ORDER BY s.gpa DESC;\n\n(c) SELECT d.dept_name, COUNT(s.matric_no) AS student_count FROM departments d LEFT JOIN students s ON d.dept_id = s.department_id GROUP BY d.dept_name ORDER BY student_count DESC; — LEFT JOIN ensures departments with zero students still appear with a count of 0.\n\n(d) WHERE filters individual rows BEFORE grouping: 'WHERE level = 300' removes non-300-level rows before any aggregation. HAVING filters groups AFTER GROUP BY and aggregation: 'HAVING COUNT(*) > 10' keeps only groups with more than 10 members. You cannot use aggregate functions in WHERE. Example: SELECT department_id, AVG(gpa) FROM students WHERE level >= 200 GROUP BY department_id HAVING AVG(gpa) > 3.5; — WHERE first eliminates 100-level students, then GROUP BY groups by department, then HAVING keeps only high-performing departments.",
            ],
            [
                'content' => "(a) Define the ACID properties of a transaction and explain why each is important. (12 marks)\n(b) Describe the Lost Update and Dirty Read concurrency problems. Illustrate each with a scenario involving a bank account database. (8 marks)",
                'topic' => 'transactions',
                'answer' => '(a) Atomicity: all-or-nothing execution. Consistency: database moves between consistent states. Isolation: concurrent transactions do not interfere. Durability: committed changes persist through failures. (b) Lost Update: two transactions read same balance and update independently, one overwriting the other. Dirty Read: transaction reads uncommitted data from another transaction that later rolls back.',
                'deep' => "(a) Atomicity — ensures a transaction is indivisible. If a bank transfer debits ₦50,000 from Account A but crashes before crediting Account B, atomicity ensures the debit is rolled back. Without it, money would disappear. Enforced via WAL (Write-Ahead Logging). Consistency — guarantees that integrity constraints hold before and after the transaction. If a constraint says total balance across all accounts must remain constant, a transfer that satisfies this is consistent. Isolation — ensures that concurrent transactions produce the same result as if they ran sequentially. Without isolation, interleaved operations could see partial results. Enforced via locking protocols (2PL) or MVCC. Durability — once COMMIT returns success, the data survives any subsequent failure (power loss, disk crash). Enforced by writing log records to stable storage before acknowledging the commit.\n\n(b) Lost Update: T1 reads balance = ₦100,000. T2 reads balance = ₦100,000. T1 adds ₦20,000, writes ₦120,000. T2 adds ₦30,000, writes ₦130,000 (overwriting T1's update). Correct result should be ₦150,000 — ₦20,000 was lost. Dirty Read: T1 transfers ₦50,000 from A to B (A becomes ₦50,000, B becomes ₦150,000). T2 reads B = ₦150,000 and uses it. T1 then ROLLBACKS (B goes back to ₦100,000). T2 has used a value (₦150,000) that never actually existed in a committed state.",
            ],
        ];

        foreach ($theories as $index => $theory) {
            $question = \App\Models\Question::create([
                'institution_course_id' => $this->courseId,
                'question_paper_id' => $paper->id,
                'question_section_id' => $section->id,
                'question_type' => QuestionType::Theory,
                'content' => $theory['content'],
                'marks' => 20,
                'sort_order' => $index + 1,
                'difficulty_level' => QuestionDifficulty::Hard,
                'bloom_level' => BloomLevel::Analyze,
                'status' => QuestionStatus::Published,
                'is_published' => true,
                'published_at' => now(),
                'year' => 2024,
                'semester' => 'first',
                'source' => QuestionSource::Manual,
                'created_by' => $this->contentUserId,
            ]);

            QuestionTopicLink::create([
                'question_id' => $question->id,
                'canonical_topic_id' => $topics[$theory['topic']]->id,
                'is_primary' => true,
            ]);

            QuestionAnswer::create([
                'question_id' => $question->id,
                'depth_level' => AnswerDepthLevel::Quick,
                'content' => $this->doc([$this->p($theory['answer'])]),
                'content_plain' => $theory['answer'],
                'is_published' => true,
                'created_by' => $this->contentUserId,
            ]);

            QuestionAnswer::create([
                'question_id' => $question->id,
                'depth_level' => AnswerDepthLevel::DeepDive,
                'content' => $this->doc(array_map(fn ($para) => $this->p($para), explode("\n\n", $theory['deep']))),
                'content_plain' => $theory['deep'],
                'is_published' => true,
                'created_by' => $this->contentUserId,
            ]);
        }
    }

    /** @return array{type: string, content: array<int, mixed>} */
    private function doc(array $content): array
    {
        return ['type' => 'doc', 'content' => $content];
    }

    /** @return array{type: string, content: array<int, mixed>} */
    private function p(string|array $content): array
    {
        if (is_string($content)) {
            return ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $content]]];
        }

        return ['type' => 'paragraph', 'content' => $content];
    }

    /** @return array{type: string, marks: array<int, array{type: string}>, text: string} */
    private function bold(string $text): array
    {
        return ['type' => 'text', 'marks' => [['type' => 'bold']], 'text' => $text];
    }

    /** @return array{type: string, text: string} */
    private function text(string $text): array
    {
        return ['type' => 'text', 'text' => $text];
    }

    /** @return array{type: string, content: array<int, mixed>} */
    private function ul(array $items): array
    {
        return ['type' => 'bulletList', 'content' => array_map(fn ($item) => [
            'type' => 'listItem',
            'content' => [is_string($item) ? $this->p($item) : $item],
        ], $items)];
    }

    /** @return array{type: string, content: array<int, mixed>} */
    private function ol(array $items): array
    {
        return ['type' => 'orderedList', 'content' => array_map(fn ($item) => [
            'type' => 'listItem',
            'content' => [is_string($item) ? $this->p($item) : $item],
        ], $items)];
    }

    /** @return array{type: string, attrs: array{language: string}, content: array<int, mixed>} */
    private function code(string $code, string $lang = 'sql'): array
    {
        return ['type' => 'codeBlock', 'attrs' => ['language' => $lang], 'content' => [['type' => 'text', 'text' => $code]]];
    }
}
