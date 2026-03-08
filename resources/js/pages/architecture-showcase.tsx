import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { BlockTypeIcon, DifficultyBadge } from '@/components/skoolpad/block-tree';
import { CalendarDayCell, CalendarGrid, CalendarHeader, CalendarMini, ExamDayCell, ExamDayModal, ExamPeriodSetupModal, useCalendar, useExamPeriod } from '@/components/skoolpad/calendar';
import type { CalendarDay, CalendarMiniEvent } from '@/components/skoolpad/calendar';
import { Button } from '@/components/ui/button';
import { ClipboardList, Pencil, Plus, X } from 'lucide-react';
import { QuestionTypeBadge, QuestionRenderer, ContextCard, QUESTION_TYPE_META } from '@/components/skoolpad/questions';
import type { ShowcaseQuestion } from '@/components/skoolpad/questions';
import type { ContextCardData } from '@/components/skoolpad/questions';
import SpBadge from '@/components/skoolpad/sp-badge';
import { cn } from '@/lib/utils';
import { useAppearance } from '@/hooks/use-appearance';

interface Block {
    id: string;
    title: string;
    slug: string;
    blockType: 'container' | 'text' | 'code' | 'diagram' | 'example' | 'exercise' | 'quiz' | 'reference' | 'comparison';
    path: string;
    depthLevel: number;
    estimatedReadTime: number | null;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | null;
    bloomLevel: string | null;
    isContainer: boolean;
    children: Block[];
}

interface CoverageCard {
    courseCode: string;
    courseTitle: string;
    level: string;
    institution: string;
    blocksCount: number;
    totalBlocks: number;
    coveragePercent: number;
    primaryDepth: string;
    weekStart: number;
    weekEnd: number;
    variant: 'canopy' | 'ember' | 'honey';
}

interface BorrowedCourse {
    code: string;
    name: string;
    units: number;
    fromDept: string;
}

interface PrereqNode {
    code: string;
    title: string;
    level: string;
}

interface FlatQuestion {
    num: number;
    text: string;
    type: string;
    marks: number;
}

interface FormatExample {
    title: string;
    examSource: string;
    contextType?: string;
    context?: ContextCardData;
    contexts?: ContextCardData[];
    questions: ShowcaseQuestion[];
    description: string;
}

const DSA_TREE: Block = {
    id: 'dsa-root',
    title: 'Fundamentals of Data Structures',
    slug: 'fundamentals-of-data-structures',
    blockType: 'container',
    path: '',
    depthLevel: 0,
    estimatedReadTime: null,
    difficultyLevel: null,
    bloomLevel: null,
    isContainer: true,
    children: [
        {
            id: 'primitive-types',
            title: 'Primitive Data Types',
            slug: 'primitive-data-types',
            blockType: 'container',
            path: '1',
            depthLevel: 1,
            estimatedReadTime: null,
            difficultyLevel: null,
            bloomLevel: null,
            isContainer: true,
            children: [
                { id: 'int-types', title: 'Integer Types', slug: 'integer-types', blockType: 'text', path: '1.1', depthLevel: 2, estimatedReadTime: 5, difficultyLevel: 'beginner', bloomLevel: 'Remember', isContainer: false, children: [] },
                { id: 'float-types', title: 'Floating Point Types', slug: 'floating-point-types', blockType: 'text', path: '1.2', depthLevel: 2, estimatedReadTime: 5, difficultyLevel: 'beginner', bloomLevel: 'Remember', isContainer: false, children: [] },
                { id: 'char-types', title: 'Character Types', slug: 'character-types', blockType: 'text', path: '1.3', depthLevel: 2, estimatedReadTime: 4, difficultyLevel: 'beginner', bloomLevel: 'Remember', isContainer: false, children: [] },
                { id: 'bool-types', title: 'Boolean Types', slug: 'boolean-types', blockType: 'text', path: '1.4', depthLevel: 2, estimatedReadTime: 3, difficultyLevel: 'beginner', bloomLevel: 'Remember', isContainer: false, children: [] },
            ],
        },
        {
            id: 'linear-structures',
            title: 'Linear Data Structures',
            slug: 'linear-data-structures',
            blockType: 'container',
            path: '2',
            depthLevel: 1,
            estimatedReadTime: null,
            difficultyLevel: null,
            bloomLevel: null,
            isContainer: true,
            children: [
                {
                    id: 'arrays',
                    title: 'Arrays',
                    slug: 'arrays',
                    blockType: 'container',
                    path: '2.1',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        { id: 'arr-1d', title: 'One-Dimensional Arrays', slug: 'one-dimensional-arrays', blockType: 'text', path: '2.1.1', depthLevel: 3, estimatedReadTime: 6, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'arr-md', title: 'Multi-Dimensional Arrays', slug: 'multi-dimensional-arrays', blockType: 'text', path: '2.1.2', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'arr-ops', title: 'Array Operations (Insert, Delete, Search)', slug: 'array-operations', blockType: 'code', path: '2.1.3', depthLevel: 3, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'arr-time', title: 'Time Complexity of Array Operations', slug: 'array-time-complexity', blockType: 'text', path: '2.1.4', depthLevel: 3, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Analyze', isContainer: false, children: [] },
                    ],
                },
                {
                    id: 'records',
                    title: 'Records (Structures)',
                    slug: 'records-structures',
                    blockType: 'container',
                    path: '2.2',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        { id: 'rec-def', title: 'Defining Records', slug: 'defining-records', blockType: 'text', path: '2.2.1', depthLevel: 3, estimatedReadTime: 5, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'rec-access', title: 'Accessing Record Fields', slug: 'accessing-record-fields', blockType: 'code', path: '2.2.2', depthLevel: 3, estimatedReadTime: 6, difficultyLevel: 'beginner', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'rec-arr', title: 'Arrays of Records', slug: 'arrays-of-records', blockType: 'code', path: '2.2.3', depthLevel: 3, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                    ],
                },
                {
                    id: 'strings',
                    title: 'Strings',
                    slug: 'strings',
                    blockType: 'container',
                    path: '2.3',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        { id: 'str-rep', title: 'String Representation', slug: 'string-representation', blockType: 'text', path: '2.3.1', depthLevel: 3, estimatedReadTime: 5, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'str-ops', title: 'String Operations', slug: 'string-operations', blockType: 'code', path: '2.3.2', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'str-algo', title: 'String Processing Algorithms', slug: 'string-processing-algorithms', blockType: 'code', path: '2.3.3', depthLevel: 3, estimatedReadTime: 10, difficultyLevel: 'advanced', bloomLevel: 'Analyze', isContainer: false, children: [] },
                    ],
                },
                {
                    id: 'linked-structures',
                    title: 'Linked Structures',
                    slug: 'linked-structures',
                    blockType: 'container',
                    path: '2.4',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        {
                            id: 'pointers',
                            title: 'Pointers and References',
                            slug: 'pointers-and-references',
                            blockType: 'container',
                            path: '2.4.1',
                            depthLevel: 3,
                            estimatedReadTime: null,
                            difficultyLevel: null,
                            bloomLevel: null,
                            isContainer: true,
                            children: [
                                { id: 'ptr-basics', title: 'Pointer Basics', slug: 'pointer-basics', blockType: 'text', path: '2.4.1.1', depthLevel: 4, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                                { id: 'ptr-arith', title: 'Pointer Arithmetic', slug: 'pointer-arithmetic', blockType: 'code', path: '2.4.1.2', depthLevel: 4, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                                { id: 'ptr-deref', title: 'Dereferencing', slug: 'dereferencing', blockType: 'code', path: '2.4.1.3', depthLevel: 4, estimatedReadTime: 6, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                            ],
                        },
                        {
                            id: 'singly-ll',
                            title: 'Singly Linked Lists',
                            slug: 'singly-linked-lists',
                            blockType: 'container',
                            path: '2.4.2',
                            depthLevel: 3,
                            estimatedReadTime: null,
                            difficultyLevel: null,
                            bloomLevel: null,
                            isContainer: true,
                            children: [
                                { id: 'sll-node', title: 'Node Structure', slug: 'node-structure', blockType: 'code', path: '2.4.2.1', depthLevel: 4, estimatedReadTime: 6, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                                { id: 'sll-insert', title: 'Insertion Operations', slug: 'insertion-operations', blockType: 'code', path: '2.4.2.2', depthLevel: 4, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                                { id: 'sll-delete', title: 'Deletion Operations', slug: 'deletion-operations', blockType: 'code', path: '2.4.2.3', depthLevel: 4, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                                { id: 'sll-traverse', title: 'Traversal', slug: 'traversal', blockType: 'code', path: '2.4.2.4', depthLevel: 4, estimatedReadTime: 6, difficultyLevel: 'beginner', bloomLevel: 'Apply', isContainer: false, children: [] },
                                { id: 'sll-search', title: 'Searching', slug: 'searching', blockType: 'code', path: '2.4.2.5', depthLevel: 4, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                            ],
                        },
                        { id: 'doubly-ll', title: 'Doubly Linked Lists', slug: 'doubly-linked-lists', blockType: 'text', path: '2.4.3', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'circular-ll', title: 'Circular Linked Lists', slug: 'circular-linked-lists', blockType: 'text', path: '2.4.4', depthLevel: 3, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'arr-vs-ll', title: 'Comparison: Arrays vs Linked Lists', slug: 'arrays-vs-linked-lists', blockType: 'comparison', path: '2.4.5', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Analyze', isContainer: false, children: [] },
                    ],
                },
                {
                    id: 'stacks',
                    title: 'Stacks',
                    slug: 'stacks',
                    blockType: 'container',
                    path: '2.5',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        { id: 'stack-concept', title: 'Stack Concept (LIFO)', slug: 'stack-concept-lifo', blockType: 'text', path: '2.5.1', depthLevel: 3, estimatedReadTime: 5, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'stack-ops', title: 'Stack Operations (Push, Pop, Peek)', slug: 'stack-operations', blockType: 'code', path: '2.5.2', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'stack-arr', title: 'Array-Based Stack Implementation', slug: 'array-based-stack', blockType: 'code', path: '2.5.3', depthLevel: 3, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'stack-ll', title: 'Linked List Stack Implementation', slug: 'linked-list-stack', blockType: 'code', path: '2.5.4', depthLevel: 3, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'stack-apps', title: 'Stack Applications', slug: 'stack-applications', blockType: 'example', path: '2.5.5', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'advanced', bloomLevel: 'Apply', isContainer: false, children: [] },
                    ],
                },
                {
                    id: 'queues',
                    title: 'Queues',
                    slug: 'queues',
                    blockType: 'container',
                    path: '2.6',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        { id: 'queue-concept', title: 'Queue Concept (FIFO)', slug: 'queue-concept-fifo', blockType: 'text', path: '2.6.1', depthLevel: 3, estimatedReadTime: 5, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                        { id: 'queue-ops', title: 'Queue Operations (Enqueue, Dequeue, Front)', slug: 'queue-operations', blockType: 'code', path: '2.6.2', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'queue-arr', title: 'Array-Based Queue Implementation', slug: 'array-based-queue', blockType: 'code', path: '2.6.3', depthLevel: 3, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'circ-queue', title: 'Circular Queue', slug: 'circular-queue', blockType: 'code', path: '2.6.4', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'queue-ll', title: 'Linked List Queue Implementation', slug: 'linked-list-queue', blockType: 'code', path: '2.6.5', depthLevel: 3, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                        { id: 'queue-apps', title: 'Queue Applications (Scheduling, BFS)', slug: 'queue-applications', blockType: 'example', path: '2.6.6', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'advanced', bloomLevel: 'Apply', isContainer: false, children: [] },
                    ],
                },
            ],
        },
        {
            id: 'nonlinear-structures',
            title: 'Non-Linear Data Structures',
            slug: 'non-linear-data-structures',
            blockType: 'container',
            path: '3',
            depthLevel: 1,
            estimatedReadTime: null,
            difficultyLevel: null,
            bloomLevel: null,
            isContainer: true,
            children: [
                {
                    id: 'trees',
                    title: 'Trees',
                    slug: 'trees',
                    blockType: 'container',
                    path: '3.1',
                    depthLevel: 2,
                    estimatedReadTime: null,
                    difficultyLevel: null,
                    bloomLevel: null,
                    isContainer: true,
                    children: [
                        { id: 'tree-terms', title: 'Tree Terminology', slug: 'tree-terminology', blockType: 'text', path: '3.1.1', depthLevel: 3, estimatedReadTime: 6, difficultyLevel: 'beginner', bloomLevel: 'Remember', isContainer: false, children: [] },
                        {
                            id: 'binary-trees',
                            title: 'Binary Trees',
                            slug: 'binary-trees',
                            blockType: 'container',
                            path: '3.1.2',
                            depthLevel: 3,
                            estimatedReadTime: null,
                            difficultyLevel: null,
                            bloomLevel: null,
                            isContainer: true,
                            children: [
                                { id: 'bt-struct', title: 'Binary Tree Structure', slug: 'binary-tree-structure', blockType: 'text', path: '3.1.2.1', depthLevel: 4, estimatedReadTime: 6, difficultyLevel: 'beginner', bloomLevel: 'Understand', isContainer: false, children: [] },
                                { id: 'bt-types', title: 'Types of Binary Trees', slug: 'types-of-binary-trees', blockType: 'text', path: '3.1.2.2', depthLevel: 4, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                                { id: 'bt-traversals', title: 'Tree Traversals (In/Pre/Post-order)', slug: 'tree-traversals', blockType: 'code', path: '3.1.2.3', depthLevel: 4, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                            ],
                        },
                        {
                            id: 'bst',
                            title: 'Binary Search Trees (BST)',
                            slug: 'binary-search-trees',
                            blockType: 'container',
                            path: '3.1.3',
                            depthLevel: 3,
                            estimatedReadTime: null,
                            difficultyLevel: null,
                            bloomLevel: null,
                            isContainer: true,
                            children: [
                                { id: 'bst-props', title: 'BST Properties', slug: 'bst-properties', blockType: 'text', path: '3.1.3.1', depthLevel: 4, estimatedReadTime: 6, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                                { id: 'bst-insert', title: 'BST Insertion', slug: 'bst-insertion', blockType: 'code', path: '3.1.3.2', depthLevel: 4, estimatedReadTime: 10, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                                { id: 'bst-delete', title: 'BST Deletion', slug: 'bst-deletion', blockType: 'code', path: '3.1.3.3', depthLevel: 4, estimatedReadTime: 10, difficultyLevel: 'advanced', bloomLevel: 'Apply', isContainer: false, children: [] },
                                { id: 'bst-search', title: 'BST Search', slug: 'bst-search', blockType: 'code', path: '3.1.3.4', depthLevel: 4, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Apply', isContainer: false, children: [] },
                            ],
                        },
                        { id: 'tree-impl', title: 'Tree Implementation Strategies', slug: 'tree-implementation-strategies', blockType: 'text', path: '3.1.4', depthLevel: 3, estimatedReadTime: 8, difficultyLevel: 'advanced', bloomLevel: 'Analyze', isContainer: false, children: [] },
                    ],
                },
            ],
        },
        {
            id: 'memory-mgmt',
            title: 'Memory Management',
            slug: 'memory-management',
            blockType: 'container',
            path: '4',
            depthLevel: 1,
            estimatedReadTime: null,
            difficultyLevel: null,
            bloomLevel: null,
            isContainer: true,
            children: [
                { id: 'mem-rep', title: 'Data Representation in Memory', slug: 'data-representation', blockType: 'text', path: '4.1', depthLevel: 2, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                { id: 'stack-alloc', title: 'Stack Allocation', slug: 'stack-allocation', blockType: 'text', path: '4.2', depthLevel: 2, estimatedReadTime: 7, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                { id: 'heap-alloc', title: 'Heap Allocation', slug: 'heap-allocation', blockType: 'text', path: '4.3', depthLevel: 2, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Understand', isContainer: false, children: [] },
                { id: 'runtime-mgmt', title: 'Runtime Storage Management', slug: 'runtime-storage-management', blockType: 'text', path: '4.4', depthLevel: 2, estimatedReadTime: 10, difficultyLevel: 'advanced', bloomLevel: 'Analyze', isContainer: false, children: [] },
            ],
        },
        {
            id: 'impl-strategies',
            title: 'Implementation Strategies',
            slug: 'implementation-strategies',
            blockType: 'container',
            path: '5',
            depthLevel: 1,
            estimatedReadTime: null,
            difficultyLevel: null,
            bloomLevel: null,
            isContainer: true,
            children: [
                { id: 'impl-stack', title: 'Stack Implementation Comparison', slug: 'stack-implementation-comparison', blockType: 'comparison', path: '5.1', depthLevel: 2, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Analyze', isContainer: false, children: [] },
                { id: 'impl-queue', title: 'Queue Implementation Comparison', slug: 'queue-implementation-comparison', blockType: 'comparison', path: '5.2', depthLevel: 2, estimatedReadTime: 8, difficultyLevel: 'intermediate', bloomLevel: 'Analyze', isContainer: false, children: [] },
                { id: 'impl-tree', title: 'Tree Implementation Strategies', slug: 'tree-impl-strategies', blockType: 'comparison', path: '5.3', depthLevel: 2, estimatedReadTime: 10, difficultyLevel: 'advanced', bloomLevel: 'Evaluate', isContainer: false, children: [] },
            ],
        },
    ],
};

const COVERAGE_CARDS: CoverageCard[] = [
    { courseCode: 'CSC 111', courseTitle: 'Introduction to Computer Science', level: '100 Level', institution: 'LASU', blocksCount: 9, totalBlocks: 79, coveragePercent: 12, primaryDepth: 'Introductory', weekStart: 5, weekEnd: 6, variant: 'canopy' },
    { courseCode: 'CSC 224', courseTitle: 'Fundamentals of Data Structures', level: '200 Level', institution: 'MOUAU', blocksCount: 42, totalBlocks: 79, coveragePercent: 53, primaryDepth: 'Intermediate', weekStart: 1, weekEnd: 15, variant: 'ember' },
    { courseCode: 'CSC 311', courseTitle: 'Advanced Algorithms', level: '300 Level', institution: 'UNIOSUN', blocksCount: 12, totalBlocks: 79, coveragePercent: 15, primaryDepth: 'Advanced', weekStart: 3, weekEnd: 8, variant: 'honey' },
];

const BORROWED_COURSES: { category: string; color: string; courses: BorrowedCourse[] }[] = [
    {
        category: 'Major Courses',
        color: 'var(--primary)',
        courses: [{ code: 'CSC 101', name: 'Hands-on Computer', units: 1, fromDept: 'Computer Science' }],
    },
    {
        category: 'Required Ancillary',
        color: 'var(--warning)',
        courses: [
            { code: 'MTH 101', name: 'General Mathematics I', units: 3, fromDept: 'Mathematics' },
            { code: 'MTH 103', name: 'General Mathematics III', units: 3, fromDept: 'Mathematics' },
            { code: 'PHY 101', name: 'General Physics I', units: 3, fromDept: 'Physics' },
            { code: 'PHY 105', name: 'General Physics Lab I', units: 1, fromDept: 'Physics' },
            { code: 'CHM 101', name: 'General Chemistry I', units: 3, fromDept: 'Chemistry' },
        ],
    },
    {
        category: 'General Studies',
        color: 'var(--muted-foreground)',
        courses: [
            { code: 'GST 111', name: 'Communication in English I', units: 2, fromDept: 'University-wide' },
            { code: 'GST 113', name: 'Nigerian Peoples & Culture', units: 2, fromDept: 'University-wide' },
            { code: 'GST 121', name: 'Library & Study Skills', units: 2, fromDept: 'University-wide' },
            { code: 'GST 123', name: 'Communication in French', units: 2, fromDept: 'University-wide' },
            { code: 'GST 125', name: 'Intro to Entrepreneurship', units: 2, fromDept: 'University-wide' },
        ],
    },
];

const ELECTIVE_OPTIONS = [
    { code: 'CSC 421', name: 'Project Management', units: 2 },
    { code: 'CSC 437', name: 'System Performance Evaluation', units: 2 },
    { code: 'CSC 447', name: 'Computer Graphics', units: 2 },
    { code: 'CSC 453', name: 'Numerical Methods II', units: 2 },
    { code: 'CSC 457', name: 'Queuing Systems', units: 2 },
    { code: 'CSC 459', name: 'Formal Models of Computation', units: 2 },
];

const PREREQ_CHAINS: { nodes: PrereqNode[]; links: [number, number][] }[] = [
    {
        nodes: [
            { code: 'CSC 211', title: 'Computer Programming I', level: '200L' },
            { code: 'CSC 215', title: 'Computer Programming II', level: '200L' },
            { code: 'CSC 224', title: 'Data Structures', level: '200L' },
            { code: 'CSC 325', title: 'Algorithms & Complexity', level: '300L' },
            { code: 'CSC 319', title: 'Survey of Prog. Languages', level: '300L' },
            { code: 'CSC 434', title: 'Compiler Construction', level: '400L' },
        ],
        links: [[0, 2], [1, 2], [2, 3], [3, 5], [4, 5]],
    },
    {
        nodes: [
            { code: 'MTH 101', title: 'General Mathematics I', level: '100L' },
            { code: 'MTH 102', title: 'General Mathematics II', level: '100L' },
            { code: 'MTH 227', title: 'Differential Equations', level: '200L' },
        ],
        links: [[0, 2], [1, 2]],
    },
];

const FLAT_QUESTIONS: FlatQuestion[] = [
    { num: 1, text: 'Define the term "Abstract Data Type"', type: 'theory', marks: 2 },
    { num: 2, text: 'Differentiate between Stack and Queue', type: 'theory', marks: 3 },
    { num: 3, text: 'Write pseudocode for push operation', type: 'theory', marks: 5 },
    { num: 4, text: 'What is recursion?', type: 'theory', marks: 2 },
    { num: 5, text: 'Write recursive function for factorial', type: 'theory', marks: 5 },
    { num: 6, text: 'Analyze the time complexity', type: 'theory', marks: 3 },
    { num: 7, text: 'Which is NOT a linear data structure?', type: 'mcq', marks: 1 },
    { num: 8, text: 'Explain binary search trees', type: 'theory', marks: 10 },
    { num: 9, text: 'Implement BST insertion', type: 'theory', marks: 10 },
    { num: 10, text: 'Implement BST deletion', type: 'theory', marks: 10 },
];

const PAPER_QUESTIONS: { section: string; instruction: string; marks: number; questions: ShowcaseQuestion[] }[] = [
    {
        section: 'A',
        instruction: 'Answer ALL questions',
        marks: 40,
        questions: [
            {
                number: '1',
                displayLabel: 'Question 1',
                type: 'group',
                content: '',
                marks: 10,
                children: [
                    { number: '1(a)', displayLabel: '(a)', type: 'theory', content: 'Define the term "Abstract Data Type"', marks: 2, children: [] },
                    { number: '1(b)', displayLabel: '(b)', type: 'theory', content: 'Differentiate between Stack and Queue', marks: 3, children: [] },
                    { number: '1(c)', displayLabel: '(c)', type: 'theory', content: 'Write a pseudocode for the push operation in a stack', marks: 5, children: [] },
                ],
            },
            {
                number: '2',
                displayLabel: 'Question 2',
                type: 'group',
                content: '',
                marks: 10,
                children: [
                    { number: '2(a)', displayLabel: '(a)', type: 'theory', content: 'What is recursion?', marks: 2, children: [] },
                    {
                        number: '2(b)',
                        displayLabel: '(b)',
                        type: 'group',
                        content: '',
                        marks: 8,
                        children: [
                            { number: '2(b)(i)', displayLabel: '(i)', type: 'theory', content: 'Write a recursive function to compute factorial', marks: 5, children: [] },
                            { number: '2(b)(ii)', displayLabel: '(ii)', type: 'theory', content: 'Analyze the time complexity of your solution', marks: 3, children: [] },
                        ],
                    },
                ],
            },
            {
                number: '3',
                displayLabel: 'Question 3',
                type: 'mcq',
                content: 'Which of the following is NOT a linear data structure?',
                marks: 2,
                options: [
                    { label: 'A', text: 'Array' },
                    { label: 'B', text: 'Linked List' },
                    { label: 'C', text: 'Tree', isCorrect: true },
                    { label: 'D', text: 'Stack' },
                ],
                children: [],
            },
        ],
    },
    {
        section: 'B',
        instruction: 'Answer any TWO questions',
        marks: 60,
        questions: [
            {
                number: '4',
                displayLabel: 'Question 4',
                type: 'group',
                content: '',
                marks: 30,
                children: [
                    { number: '4(a)', displayLabel: '(a)', type: 'theory', content: 'Explain the concept of binary search trees', marks: 10, children: [] },
                    {
                        number: '4(b)',
                        displayLabel: '(b)',
                        type: 'group',
                        content: 'Implement the following BST operations:',
                        marks: 20,
                        children: [
                            { number: '4(b)(i)', displayLabel: '(i)', type: 'theory', content: 'Insertion', marks: 10, children: [] },
                            { number: '4(b)(ii)', displayLabel: '(ii)', type: 'theory', content: 'Deletion', marks: 10, children: [] },
                        ],
                    },
                ],
            },
            {
                number: '5',
                displayLabel: 'Question 5',
                type: 'group',
                content: 'Write comprehensive notes on:',
                marks: 30,
                children: [
                    { number: '5(a)', displayLabel: '(a)', type: 'theory', content: 'Graph representation methods', marks: 15, children: [] },
                    { number: '5(b)', displayLabel: '(b)', type: 'theory', content: 'Depth-first search algorithm', marks: 15, children: [] },
                ],
            },
        ],
    },
];

const FORMAT_EXAMPLES: FormatExample[] = [
    {
        title: 'Comprehension Passage',
        examSource: 'WAEC English Language 2023',
        contextType: 'passage',
        description: 'A shared passage context with multiple derived questions. The passage is stored once and referenced by all child questions.',
        context: {
            id: 'ctx-passage-1',
            contextType: 'passage',
            title: 'Read the following passage and answer the questions that follow',
            content: 'Deforestation has emerged as one of the most devastating environmental challenges facing the African continent. In Nigeria alone, the country loses approximately 3.5% of its forest cover annually, a rate that experts describe as alarming. The consequences extend beyond the immediate loss of biodiversity; local communities that depend on forest resources for their livelihoods are increasingly vulnerable. Government policies aimed at curbing deforestation have yielded limited results, leading environmentalists to advocate for community-driven conservation initiatives.',
        },
        questions: [
            {
                number: '1', displayLabel: 'Question 1', type: 'group', content: '', marks: 20,
                children: [
                    {
                        number: '1(a)', displayLabel: '(a)', type: 'mcq', marks: 2,
                        content: 'The word "devastating" as used in the passage means',
                        options: [
                            { label: 'A', text: 'interesting' },
                            { label: 'B', text: 'destructive', isCorrect: true },
                            { label: 'C', text: 'important' },
                            { label: 'D', text: 'surprising' },
                        ],
                        children: [],
                    },
                    {
                        number: '1(b)', displayLabel: '(b)', type: 'mcq', marks: 2,
                        content: 'According to the passage, Nigeria loses what percentage of forest cover annually?',
                        options: [
                            { label: 'A', text: '2.5%' },
                            { label: 'B', text: '3.5%', isCorrect: true },
                            { label: 'C', text: '4.5%' },
                            { label: 'D', text: '5.5%' },
                        ],
                        children: [],
                    },
                    {
                        number: '1(c)', displayLabel: '(c)', type: 'theory', marks: 6,
                        content: 'In your own words, summarize the main argument of the passage in not more than two sentences.',
                        children: [],
                    },
                    {
                        number: '1(d)', displayLabel: '(d)', type: 'mcq', marks: 2,
                        content: 'The tone of the passage can best be described as',
                        options: [
                            { label: 'A', text: 'humorous' },
                            { label: 'B', text: 'indifferent' },
                            { label: 'C', text: 'urgent and concerned', isCorrect: true },
                            { label: 'D', text: 'celebratory' },
                        ],
                        children: [],
                    },
                    {
                        number: '1(e)', displayLabel: '(e)', type: 'theory', marks: 8,
                        content: 'Discuss two reasons why government policies on deforestation have yielded limited results, and suggest alternative approaches.',
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        title: 'Diagram-Based Questions',
        examSource: 'WAEC Biology 2022',
        contextType: 'diagram',
        description: 'A diagram context (image stored separately) with labeling and theory questions derived from the visual.',
        context: {
            id: 'ctx-diagram-1',
            contextType: 'diagram',
            title: 'Study the diagram below which represents the internal structure of the mammalian heart and answer questions 2(a) to 2(d)',
            mediaUrl: '/diagrams/mammalian-heart.png',
        },
        questions: [
            {
                number: '2', displayLabel: 'Question 2', type: 'theory', marks: 25,
                content: 'The diagram shows the internal structure of a mammalian heart. Study it carefully.',
                contextId: 'ctx-diagram-1',
                children: [
                    {
                        number: '2(a)', displayLabel: '(a)', type: 'diagram_label', marks: 8,
                        content: 'Label the parts marked I to IV on the diagram.',
                        diagramLabels: [
                            { label: 'I', answer: 'Right atrium' },
                            { label: 'II', answer: 'Left ventricle' },
                            { label: 'III', answer: 'Pulmonary artery' },
                            { label: 'IV', answer: 'Aorta' },
                        ],
                        children: [],
                    },
                    {
                        number: '2(b)', displayLabel: '(b)', type: 'theory', marks: 7,
                        content: 'Describe the flow of blood through the heart, starting from the vena cava.',
                        children: [],
                    },
                    {
                        number: '2(c)', displayLabel: '(c)', type: 'mcq', marks: 2,
                        content: 'Which chamber of the heart receives deoxygenated blood from the body?',
                        options: [
                            { label: 'A', text: 'Left atrium' },
                            { label: 'B', text: 'Right atrium', isCorrect: true },
                            { label: 'C', text: 'Left ventricle' },
                            { label: 'D', text: 'Right ventricle' },
                        ],
                        children: [],
                    },
                    {
                        number: '2(d)', displayLabel: '(d)', type: 'theory', marks: 8,
                        content: 'Explain why the wall of the left ventricle is thicker than that of the right ventricle.',
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        title: 'Data Table Interpretation',
        examSource: 'WAEC Economics 2023',
        contextType: 'table',
        description: 'A data table context with calculation and theory questions. Table data is stored as structured JSON.',
        context: {
            id: 'ctx-table-1',
            contextType: 'table',
            title: 'The table below shows the GDP (in billion Naira) of four West African countries over three years. Study it and answer the questions that follow.',
            tableData: {
                headers: ['Country', '2020', '2021', '2022'],
                rows: [
                    ['Nigeria', '152,320', '176,080', '189,990'],
                    ['Ghana', '68,530', '77,190', '82,350'],
                    ['Senegal', '24,910', '27,630', '31,100'],
                    ['Ivory Coast', '61,350', '70,990', '78,440'],
                ],
            },
        },
        questions: [
            {
                number: '5', displayLabel: 'Question 5', type: 'group', content: '', marks: 20,
                contextId: 'ctx-table-1',
                children: [
                    {
                        number: '5(a)', displayLabel: '(a)', type: 'calculation', marks: 4,
                        content: 'Calculate the percentage growth in GDP for Nigeria between 2020 and 2022.',
                        calculationAnswer: '24.7',
                        calculationUnit: '%',
                        children: [],
                    },
                    {
                        number: '5(b)', displayLabel: '(b)', type: 'calculation', marks: 4,
                        content: 'Which country recorded the highest percentage growth between 2021 and 2022? Show your working.',
                        calculationAnswer: 'Senegal (12.6%)',
                        calculationUnit: '',
                        children: [],
                    },
                    {
                        number: '5(c)', displayLabel: '(c)', type: 'theory', marks: 6,
                        content: 'Account for the difference in GDP between Nigeria and the other three countries combined.',
                        children: [],
                    },
                    {
                        number: '5(d)', displayLabel: '(d)', type: 'theory', marks: 6,
                        content: 'Discuss two factors that could explain Senegal\'s relatively high growth rate.',
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        title: 'Dual-Nature Question Hierarchy',
        examSource: 'University CSC 325 Exam',
        description: 'Q1 is BOTH a question itself (with its own content and marks) AND has sub-questions. This dual-nature pattern is common in Nigerian university exams where the parent question has answerable content.',
        questions: [
            {
                number: '1', displayLabel: 'Question 1', type: 'theory', marks: 25,
                content: 'Consider the following sorting algorithms: Bubble Sort, Merge Sort, and Quick Sort. State the time complexity (best, average, worst) for each.',
                children: [
                    {
                        number: '1(a)', displayLabel: '(a)', type: 'theory', marks: 8,
                        content: 'Compare the space complexity of these three algorithms. Which is most memory-efficient and why?',
                        children: [],
                    },
                    {
                        number: '1(b)', displayLabel: '(b)', type: 'group', marks: 12,
                        content: 'For Merge Sort specifically:',
                        children: [
                            {
                                number: '1(b)(i)', displayLabel: '(i)', type: 'theory', marks: 7,
                                content: 'Write the pseudocode for the merge sort algorithm.',
                                children: [],
                            },
                            {
                                number: '1(b)(ii)', displayLabel: '(ii)', type: 'theory', marks: 5,
                                content: 'Trace the algorithm on the array [38, 27, 43, 3, 9, 82, 10], showing each step of the divide and merge phases.',
                                children: [],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        title: 'Matching Pairs',
        examSource: 'WAEC Geography 2023',
        description: 'Match items from Column A with their correct counterparts in Column B. Includes distractors (extra options) to prevent elimination.',
        questions: [
            {
                number: '8', displayLabel: 'Question 8', type: 'matching', marks: 10,
                content: 'Match each river in Column A with the country where it primarily flows in Column B.',
                matchingPairs: [
                    { left: 'River Niger', right: 'Nigeria' },
                    { left: 'River Nile', right: 'Egypt' },
                    { left: 'River Congo', right: 'DRC' },
                    { left: 'River Zambezi', right: 'Zambia' },
                    { left: 'River Volta', right: 'Ghana' },
                ],
                matchingDistractors: ['Kenya', 'South Africa'],
                children: [],
            },
        ],
    },
    {
        title: 'Ordering / Sequencing',
        examSource: 'WAEC History 2023',
        description: 'Arrange events or items in the correct chronological or logical order.',
        questions: [
            {
                number: '12', displayLabel: 'Question 12', type: 'ordering', marks: 5,
                content: 'Arrange the following events in Nigerian history in chronological order, from earliest to latest.',
                orderItems: [
                    'Amalgamation of Northern and Southern Protectorates',
                    'Discovery of oil in Oloibiri',
                    'Independence from Britain',
                    'Nigerian Civil War begins',
                    'Return to civilian rule (Fourth Republic)',
                ],
                correctOrder: [1, 2, 3, 4, 5],
                children: [],
            },
        ],
    },
    {
        title: 'Cloze Passage (Fill-in-Blanks)',
        examSource: 'WAEC English Language 2022',
        contextType: 'passage',
        description: 'A passage with numbered gaps. Each gap has multiple options and the student selects the correct word to complete the text.',
        context: {
            id: 'ctx-cloze-1',
            contextType: 'passage',
            title: 'Fill in each gap with the most appropriate option from the list provided.',
            content: 'Photosynthesis is the process by which green plants convert ___[1]___ energy into ___[2]___ energy. This process takes place primarily in the ___[3]___ of the plant cell. During photosynthesis, carbon dioxide and ___[4]___ are converted into glucose and ___[5]___.',
        },
        questions: [
            {
                number: '15', displayLabel: 'Question 15', type: 'cloze', marks: 10,
                content: 'Complete the passage above by selecting the correct option for each numbered gap.',
                contextId: 'ctx-cloze-1',
                gapOptions: [
                    { position: 1, options: ['light', 'heat', 'kinetic', 'sound'], correct: 0 },
                    { position: 2, options: ['mechanical', 'chemical', 'thermal', 'nuclear'], correct: 1 },
                    { position: 3, options: ['nucleus', 'chloroplast', 'mitochondria', 'ribosome'], correct: 1 },
                    { position: 4, options: ['nitrogen', 'oxygen', 'water', 'hydrogen'], correct: 2 },
                    { position: 5, options: ['carbon dioxide', 'nitrogen', 'oxygen', 'methane'], correct: 2 },
                ],
                children: [],
            },
        ],
    },
    {
        title: 'True/False with Justification',
        examSource: 'NECO Biology 2023',
        description: 'Students evaluate statements as true or false, then must justify their answer with a brief explanation.',
        questions: [
            {
                number: '20', displayLabel: 'Question 20', type: 'group', marks: 12, content: 'State whether each of the following statements is TRUE or FALSE. Give a reason for your answer.',
                children: [
                    {
                        number: '20(a)', displayLabel: '(a)', type: 'true_false', marks: 3,
                        content: 'All bacteria are harmful to humans.',
                        trueFalseAnswer: false,
                        requiresJustification: true,
                        children: [],
                    },
                    {
                        number: '20(b)', displayLabel: '(b)', type: 'true_false', marks: 3,
                        content: 'The mitochondria is the powerhouse of the cell.',
                        trueFalseAnswer: true,
                        requiresJustification: true,
                        children: [],
                    },
                    {
                        number: '20(c)', displayLabel: '(c)', type: 'true_false', marks: 3,
                        content: 'Photosynthesis occurs in animal cells.',
                        trueFalseAnswer: false,
                        requiresJustification: true,
                        children: [],
                    },
                    {
                        number: '20(d)', displayLabel: '(d)', type: 'true_false', marks: 3,
                        content: 'DNA replication is semi-conservative.',
                        trueFalseAnswer: true,
                        requiresJustification: true,
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        title: 'Assertion-Reason (Indian Format)',
        examSource: 'CBSE Class 12 Physics / NEET',
        description: 'Extremely common in Indian board exams and competitive exams (CBSE, NEET, JEE). An assertion and a reason are given, and the student evaluates the relationship between them using 4 standard options.',
        questions: [
            {
                number: '31', displayLabel: 'Question 31', type: 'assertion_reason', marks: 1,
                content: 'Read the Assertion and Reason carefully and choose the correct option.',
                assertion: 'Electric field lines never intersect each other.',
                reason: 'At any point in space, the electric field has a unique direction.',
                options: [
                    { label: 'A', text: 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion', isCorrect: true },
                    { label: 'B', text: 'Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion' },
                    { label: 'C', text: 'Assertion is true but Reason is false' },
                    { label: 'D', text: 'Assertion is false but Reason is true' },
                ],
                children: [],
            },
            {
                number: '32', displayLabel: 'Question 32', type: 'assertion_reason', marks: 1,
                content: 'Read the Assertion and Reason carefully and choose the correct option.',
                assertion: 'A body moving in a circular path at constant speed has zero acceleration.',
                reason: 'Acceleration is the rate of change of speed.',
                options: [
                    { label: 'A', text: 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion' },
                    { label: 'B', text: 'Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion' },
                    { label: 'C', text: 'Assertion is true but Reason is false' },
                    { label: 'D', text: 'Both Assertion and Reason are false', isCorrect: true },
                ],
                children: [],
            },
        ],
    },
    {
        title: 'Matrix Matching (Many-to-Many)',
        examSource: 'JEE Advanced Physics',
        description: 'Items in Column I can each match with ONE OR MORE items in Column II. This many-to-many pattern is fundamentally different from simple 1:1 matching and is standard in JEE Advanced.',
        questions: [
            {
                number: '14', displayLabel: 'Question 14', type: 'matrix_matching', marks: 8,
                content: 'Match the physical quantities in Column I with their SI units in Column II. Each item in Column I may match with more than one item in Column II.',
                matrixLeft: ['Force', 'Energy', 'Pressure', 'Power'],
                matrixRight: ['kg\u00B7m/s\u00B2', 'N\u00B7m', 'Pa', 'J/s', 'W'],
                matrixMapping: {
                    0: [0],
                    1: [1],
                    2: [2],
                    3: [3, 4],
                },
                children: [],
            },
        ],
    },
    {
        title: 'Numeric Entry (Grid-In)',
        examSource: 'SAT Math / GRE Quantitative',
        description: 'No options provided. Student enters a specific numeric value. Can have a tolerance range for acceptable answers. Common in SAT Math (grid-in), GRE, and JEE.',
        questions: [
            {
                number: '28', displayLabel: 'Question 28', type: 'numeric_entry', marks: 1,
                content: 'If 3x + 7 = 22, what is the value of x?',
                numericAnswer: 5,
                numericTolerance: 0,
                children: [],
            },
            {
                number: '29', displayLabel: 'Question 29', type: 'numeric_entry', marks: 2,
                content: 'A circle has a circumference of 31.4 cm. What is the radius of the circle, to one decimal place? (Use \u03C0 = 3.14)',
                numericAnswer: 5.0,
                numericTolerance: 0.1,
                numericUnit: 'cm',
                children: [],
            },
        ],
    },
    {
        title: 'Multi-Source Document Based (DBQ)',
        examSource: 'AP World History',
        contextType: 'multi-context',
        description: 'Multiple source documents (passages, images, data) are provided together. Questions require synthesizing across ALL sources. This needs a many-to-many relationship between questions and contexts \u2014 a single contextId won\'t work.',
        contexts: [
            {
                id: 'ctx-dbq-src1',
                contextType: 'passage',
                title: 'Source 1: Letter from a British colonial officer, 1885',
                content: '"The partition of Africa among European powers is not merely a matter of territorial ambition. It is our duty to bring civilization and commerce to the interior regions..."',
            },
            {
                id: 'ctx-dbq-src2',
                contextType: 'passage',
                title: 'Source 2: Speech by an African chief, 1891',
                content: '"We do not need your roads or your schools if they come at the cost of our land and our freedom. Our ancestors governed these lands for centuries before your arrival..."',
            },
            {
                id: 'ctx-dbq-src3',
                contextType: 'table',
                title: 'Source 3: European territorial claims in Africa, 1870 vs 1914',
                tableData: {
                    headers: ['Region', '1870 (% European control)', '1914 (% European control)'],
                    rows: [
                        ['North Africa', '30%', '95%'],
                        ['West Africa', '10%', '85%'],
                        ['East Africa', '5%', '90%'],
                        ['Southern Africa', '25%', '95%'],
                    ],
                },
            },
        ],
        questions: [
            {
                number: '1', displayLabel: 'Question 1', type: 'essay', marks: 40,
                content: 'Using ALL THREE sources and your own knowledge, evaluate the extent to which the Scramble for Africa was driven by economic motives versus ideological justifications.',
                contextIds: ['ctx-dbq-src1', 'ctx-dbq-src2', 'ctx-dbq-src3'],
                children: [
                    {
                        number: '1(a)', displayLabel: '(a)', type: 'theory', marks: 10,
                        content: 'Identify and explain ONE point of agreement and ONE point of disagreement between Sources 1 and 2.',
                        contextIds: ['ctx-dbq-src1', 'ctx-dbq-src2'],
                        children: [],
                    },
                    {
                        number: '1(b)', displayLabel: '(b)', type: 'theory', marks: 10,
                        content: 'How does Source 3 support or challenge the claims made in Source 1?',
                        contextIds: ['ctx-dbq-src1', 'ctx-dbq-src3'],
                        children: [],
                    },
                    {
                        number: '1(c)', displayLabel: '(c)', type: 'essay', marks: 20,
                        content: 'With reference to all three sources and your own knowledge, write an essay evaluating the impact of European colonialism on African political structures.',
                        contextIds: ['ctx-dbq-src1', 'ctx-dbq-src2', 'ctx-dbq-src3'],
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        title: 'Choice-Within-Question (A-Level / IB)',
        examSource: 'IB History HL Paper 2',
        description: 'Some parts are mandatory while others offer a choice. "Answer (a) and (b), then choose ONE from (c), (d), or (e)." Needs choiceGroup metadata on sub-questions.',
        questions: [
            {
                number: '3', displayLabel: 'Question 3', type: 'group', marks: 30,
                content: 'The causes and effects of World War I.',
                children: [
                    {
                        number: '3(a)', displayLabel: '(a)', type: 'theory', marks: 5,
                        content: 'Define the term "alliance system" as it applied to European politics before 1914.',
                        children: [],
                    },
                    {
                        number: '3(b)', displayLabel: '(b)', type: 'theory', marks: 10,
                        content: 'Explain two immediate causes of World War I.',
                        children: [],
                    },
                    {
                        number: '3(c)', displayLabel: '(c)', type: 'essay', marks: 15,
                        content: 'Evaluate the role of nationalism in causing World War I.',
                        choiceGroup: { required: ['3(a)', '3(b)'], chooseN: 1, optional: ['3(c)', '3(d)', '3(e)'] },
                        children: [],
                    },
                    {
                        number: '3(d)', displayLabel: '(d)', type: 'essay', marks: 15,
                        content: 'To what extent was the Treaty of Versailles responsible for future conflicts?',
                        choiceGroup: { required: ['3(a)', '3(b)'], chooseN: 1, optional: ['3(c)', '3(d)', '3(e)'] },
                        children: [],
                    },
                    {
                        number: '3(e)', displayLabel: '(e)', type: 'essay', marks: 15,
                        content: 'Compare and contrast the impact of World War I on two countries you have studied.',
                        choiceGroup: { required: ['3(a)', '3(b)'], chooseN: 1, optional: ['3(c)', '3(d)', '3(e)'] },
                        children: [],
                    },
                ],
            },
        ],
    },
];

function countBlocks(block: Block): number {
    if (!block.isContainer) return 1;
    return block.children.reduce((acc, child) => acc + countBlocks(child), 0);
}

const TOTAL_LEAF_BLOCKS = countBlocks(DSA_TREE);

interface EducationSystemDemo {
    country: string;
    flag: string;
    systemName: string;
    isSupranational?: boolean;
    color: string;
    tiers: {
        name: string;
        levels: string[];
        streams?: string[];
        assessments?: string[];
    }[];
}

const EDUCATION_SYSTEMS: EducationSystemDemo[] = [
    {
        country: 'Nigeria',
        flag: '\uD83C\uDDF3\uD83C\uDDEC',
        systemName: 'NERDC',
        color: 'var(--canopy-400)',
        tiers: [
            { name: 'Primary', levels: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'] },
            { name: 'Junior Secondary', levels: ['JSS 1', 'JSS 2', 'JSS 3'], assessments: ['Junior WAEC (BECE)'] },
            { name: 'Senior Secondary', levels: ['SS 1', 'SS 2', 'SS 3'], streams: ['Science', 'Arts', 'Commercial'], assessments: ['WAEC', 'NECO', 'JAMB'] },
        ],
    },
    {
        country: 'Ghana',
        flag: '\uD83C\uDDEC\uD83C\uDDED',
        systemName: 'GES',
        color: 'var(--honey-400)',
        tiers: [
            { name: 'Primary', levels: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'] },
            { name: 'Junior High', levels: ['JHS 1', 'JHS 2', 'JHS 3'], assessments: ['BECE'] },
            { name: 'Senior High', levels: ['SHS 1', 'SHS 2', 'SHS 3'], streams: ['General Science', 'General Arts', 'Business', 'Home Economics', 'Visual Arts', 'Technical'], assessments: ['WASSCE'] },
        ],
    },
    {
        country: 'United Kingdom',
        flag: '\uD83C\uDDEC\uD83C\uDDE7',
        systemName: 'UK National Curriculum',
        color: 'var(--ember-400)',
        tiers: [
            { name: 'Primary', levels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'] },
            { name: 'Key Stage 3', levels: ['Year 7', 'Year 8', 'Year 9'] },
            { name: 'Key Stage 4', levels: ['Year 10', 'Year 11'], assessments: ['GCSEs'] },
            { name: 'Sixth Form', levels: ['Year 12', 'Year 13'], assessments: ['AS-Levels', 'A-Levels'] },
        ],
    },
    {
        country: 'India',
        flag: '\uD83C\uDDEE\uD83C\uDDF3',
        systemName: 'CBSE',
        color: 'var(--primary)',
        tiers: [
            { name: 'Primary', levels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
            { name: 'Upper Primary', levels: ['Class 6', 'Class 7', 'Class 8'] },
            { name: 'Secondary', levels: ['Class 9', 'Class 10'], assessments: ['Board Exams (Class 10)'] },
            { name: 'Higher Secondary', levels: ['Class 11', 'Class 12'], streams: ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Humanities'], assessments: ['Board Exams (Class 12)', 'JEE', 'NEET'] },
        ],
    },
    {
        country: 'South Africa',
        flag: '\uD83C\uDDFF\uD83C\uDDE6',
        systemName: 'CAPS',
        color: 'var(--destructive)',
        tiers: [
            { name: 'Foundation Phase', levels: ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3'] },
            { name: 'Intermediate Phase', levels: ['Grade 4', 'Grade 5', 'Grade 6'] },
            { name: 'Senior Phase', levels: ['Grade 7', 'Grade 8', 'Grade 9'] },
            { name: 'FET Phase', levels: ['Grade 10', 'Grade 11', 'Grade 12'], assessments: ['NSC (Matric)'] },
        ],
    },
    {
        country: 'International',
        flag: '\uD83C\uDF0D',
        systemName: 'Cambridge International',
        isSupranational: true,
        color: 'var(--warning)',
        tiers: [
            { name: 'Primary', levels: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5', 'Stage 6'], assessments: ['Cambridge Primary Checkpoint'] },
            { name: 'Lower Secondary', levels: ['Stage 7', 'Stage 8', 'Stage 9'], assessments: ['Cambridge Checkpoint'] },
            { name: 'IGCSE', levels: ['Year 10', 'Year 11'], assessments: ['Cambridge IGCSE'] },
            { name: 'Advanced', levels: ['Year 12', 'Year 13'], assessments: ['Cambridge AS-Level', 'Cambridge A-Level'] },
        ],
    },
];

const ENUM_COMPARISONS: { current: { name: string; values: string[] }; proposed: { table: string; description: string } }[] = [
    { current: { name: 'ClassLevel', values: ['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3'] }, proposed: { table: 'education_levels', description: 'Rows per education system \u2014 JSS 1-3 for Nigeria, Year 7-13 for UK, Class 1-12 for India' } },
    { current: { name: 'SecondaryDepartment', values: ['science', 'arts', 'commercial'] }, proposed: { table: 'streams', description: 'Optional per system \u2014 Science/Arts/Commercial for Nigeria, PCM/PCB/Commerce for India, none for UK' } },
    { current: { name: 'Term', values: ['first', 'second', 'third'] }, proposed: { table: 'calendar_terms', description: 'Per institution per year \u2014 3 terms for Nigeria, 2 semesters for US, 4 quarters for some' } },
    { current: { name: 'EducationLevel', values: ['junior_secondary', 'senior_secondary', 'tertiary'] }, proposed: { table: 'curriculum_tiers', description: 'Each system defines its own tiers \u2014 Key Stages for UK, Phases for South Africa' } },
];

interface TertiarySystemDemo {
    country: string;
    flag: string;
    types: {
        name: string;
        examples: string;
        levels: string[];
        grading: string;
        creditSystem: string;
        color: string;
    }[];
}

const TERTIARY_SYSTEMS: TertiarySystemDemo[] = [
    {
        country: 'Nigeria',
        flag: '\uD83C\uDDF3\uD83C\uDDEC',
        types: [
            { name: 'University', examples: 'UNILAG, OAU, UNIOSUN', levels: ['100L', '200L', '300L', '400L', '500L'], grading: 'CGPA 0\u20135.0 (1st Class, 2:1, 2:2, 3rd, Pass)', creditSystem: 'Credit Units (120\u2013150 total)', color: 'var(--primary)' },
            { name: 'Polytechnic', examples: 'YABATECH, AUCHI POLY', levels: ['ND I', 'ND II', 'HND I', 'HND II'], grading: 'CGPA 0\u20134.0 (Distinction, Upper Credit, Lower Credit, Pass)', creditSystem: 'Credit Units', color: 'var(--warning)' },
            { name: 'College of Education', examples: 'FCE Abeokuta, ACOE Ondo', levels: ['NCE I', 'NCE II', 'NCE III'], grading: 'CGPA 0\u20134.0 (Distinction, Credit, Merit, Pass)', creditSystem: 'Credit Units', color: 'var(--canopy-400)' },
        ],
    },
    {
        country: 'United States',
        flag: '\uD83C\uDDFA\uD83C\uDDF8',
        types: [
            { name: 'University / College', examples: 'MIT, Stanford, UCLA', levels: ['Freshman', 'Sophomore', 'Junior', 'Senior'], grading: 'GPA 0\u20134.0 (A\u2013F letter grades)', creditSystem: 'Credit Hours (120\u2013130 total)', color: 'var(--primary)' },
            { name: 'Community College', examples: '2-year programs', levels: ['Year 1', 'Year 2'], grading: 'GPA 0\u20134.0', creditSystem: 'Credit Hours (60 for Associate\u2019s)', color: 'var(--warning)' },
        ],
    },
    {
        country: 'United Kingdom',
        flag: '\uD83C\uDDEC\uD83C\uDDE7',
        types: [
            { name: 'University', examples: 'Oxford, Cambridge, UCL', levels: ['Year 1', 'Year 2', 'Year 3'], grading: 'Degree class (1st, 2:1, 2:2, 3rd, Pass)', creditSystem: 'UK Credits (360 for Bachelor\u2019s)', color: 'var(--primary)' },
            { name: 'Further Education College', examples: 'Vocational, HNC/HND', levels: ['Year 1', 'Year 2'], grading: 'Distinction, Merit, Pass', creditSystem: 'UK Credits', color: 'var(--warning)' },
        ],
    },
    {
        country: 'India',
        flag: '\uD83C\uDDEE\uD83C\uDDF3',
        types: [
            { name: 'University', examples: 'DU, JNU, IITs, NITs', levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'], grading: 'CGPA 0\u201310.0 or Percentage', creditSystem: 'Credits (CBCS)', color: 'var(--primary)' },
            { name: 'Polytechnic', examples: 'Diploma programs', levels: ['1st Year', '2nd Year', '3rd Year'], grading: 'Percentage or CGPA', creditSystem: 'Credits', color: 'var(--warning)' },
        ],
    },
    {
        country: 'Germany',
        flag: '\uD83C\uDDE9\uD83C\uDDEA',
        types: [
            { name: 'Universit\u00E4t', examples: 'TU Munich, Heidelberg', levels: ['Semester 1\u20136 (Bachelor)', 'Semester 1\u20134 (Master)'], grading: '1.0\u20134.0 (1.0 best, 4.0 pass)', creditSystem: 'ECTS (180 Bachelor, 120 Master)', color: 'var(--primary)' },
            { name: 'Fachhochschule', examples: 'Applied Sciences', levels: ['Semester 1\u20137 (Bachelor incl. internship)'], grading: '1.0\u20134.0', creditSystem: 'ECTS', color: 'var(--warning)' },
        ],
    },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-[6px] flex items-center gap-[10px]">
            <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary"
                style={{ fontFamily: 'var(--font-body)' }}
            >
                {children}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2
            className="mb-8 text-[28px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
            {children}
        </h2>
    );
}


function TreeNode({ block, expanded, selectedId, onToggle, onSelect, depth = 0 }: {
    block: Block;
    expanded: Record<string, boolean>;
    selectedId: string | null;
    onToggle: (id: string) => void;
    onSelect: (block: Block) => void;
    depth?: number;
}) {
    const isExpanded = expanded[block.id] ?? (block.depthLevel < 2);
    const isSelected = selectedId === block.id;
    const hasChildren = block.children.length > 0;

    return (
        <div>
            <button
                onClick={() => {
                    if (hasChildren) onToggle(block.id);
                    onSelect(block);
                }}
                className={
                    'flex w-full cursor-pointer items-center gap-2 rounded-lg border-l-2 px-3 py-[6px] text-left transition-all duration-150'
                    + (isSelected
                        ? ' border-primary bg-primary/5'
                        : ' border-transparent hover:bg-[var(--bg-raised)]')
                }
                style={{ paddingLeft: `${depth * 20 + 12}px` }}
            >
                {hasChildren ? (
                    <span className={'inline-block text-[10px] text-muted-foreground transition-transform duration-150' + (isExpanded ? ' rotate-90' : '')}>
                        {'\u25B6'}
                    </span>
                ) : (
                    <span className="inline-block w-[10px]" />
                )}

                <BlockTypeIcon type={block.blockType} />

                <span
                    className="flex-1 truncate text-[13px] font-medium"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {block.path ? <span className="mr-1.5 text-muted-foreground">{block.path}</span> : null}
                    {block.title}
                </span>

                {block.estimatedReadTime && (
                    <span className="shrink-0 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {block.estimatedReadTime}m
                    </span>
                )}

                <DifficultyBadge level={block.difficultyLevel} />
            </button>

            {hasChildren && isExpanded && (
                <div>
                    {block.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            block={child}
                            expanded={expanded}
                            selectedId={selectedId}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function BlockDetailPanel({ block }: { block: Block | null }) {
    if (!block) {
        return (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                <div>
                    <div className="mb-2 text-2xl">{'\uD83D\uDC48'}</div>
                    <div className="text-[13px]">Select a block to see details</div>
                </div>
            </div>
        );
    }

    const details = [
        { label: 'Path', value: block.path || 'Root' },
        { label: 'Type', value: block.blockType },
        { label: 'Read Time', value: block.estimatedReadTime ? `${block.estimatedReadTime} minutes` : 'N/A (container)' },
        { label: 'Difficulty', value: block.difficultyLevel ?? 'N/A' },
        { label: 'Bloom Level', value: block.bloomLevel ?? 'N/A' },
        { label: 'Children', value: block.children.length > 0 ? `${block.children.length} sub-blocks` : 'Leaf block (content)' },
    ];

    return (
        <div className="space-y-4">
            <div>
                <div className="mb-1 flex items-center gap-2">
                    <BlockTypeIcon type={block.blockType} />
                    <h4 className="text-[15px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{block.title}</h4>
                </div>
                <p className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{block.slug}</p>
            </div>

            <div className="space-y-2">
                {details.map((d) => (
                    <div key={d.label} className="flex items-center justify-between border-b border-border/50 pb-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{d.label}</span>
                        <span className="text-[12px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>{d.value}</span>
                    </div>
                ))}
            </div>

            {block.difficultyLevel && (
                <div className="pt-1">
                    <DifficultyBadge level={block.difficultyLevel} />
                </div>
            )}
        </div>
    );
}

function CoverageCardComponent({ card }: { card: CoverageCard }) {
    const gradients: Record<string, string> = {
        canopy: 'linear-gradient(135deg, var(--canopy-950), var(--canopy-900))',
        ember: 'linear-gradient(135deg, #5E2214, #7A2B16)',
        honey: 'linear-gradient(135deg, #3D280C, #5F4116)',
    };
    const fills: Record<string, string> = {
        canopy: 'linear-gradient(90deg, var(--canopy-600), var(--canopy-400))',
        ember: 'linear-gradient(90deg, var(--ember-500), var(--ember-400))',
        honey: 'linear-gradient(90deg, var(--honey-600), var(--honey-400))',
    };
    const codeColors: Record<string, string> = {
        canopy: 'var(--canopy-300)',
        ember: 'var(--ember-300)',
        honey: 'var(--honey-300)',
    };

    return (
        <div className="overflow-hidden rounded-[var(--card-radius)] border border-border bg-card transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg">
            <div className="px-5 py-4" style={{ background: gradients[card.variant] }}>
                <div className="text-[20px] font-bold text-white" style={{ fontFamily: 'var(--font-display)', color: codeColors[card.variant] }}>
                    {card.courseCode}
                </div>
                <div className="mt-0.5 text-[12px] text-white/60" style={{ fontFamily: 'var(--font-body)' }}>{card.courseTitle}</div>
            </div>
            <div className="space-y-3 p-5">
                <div className="flex items-baseline justify-between">
                    <span className="text-[34px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{card.coveragePercent}%</span>
                    <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>coverage</span>
                </div>
                <div className="h-[var(--prog-height,6px)] w-full overflow-hidden rounded-full bg-border/40">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${card.coveragePercent}%`, background: fills[card.variant] }}
                    />
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                    <span className="text-muted-foreground">Blocks taught</span>
                    <span className="text-right font-semibold">{card.blocksCount} / {card.totalBlocks}</span>
                    <span className="text-muted-foreground">Depth</span>
                    <span className="text-right font-semibold">{card.primaryDepth}</span>
                    <span className="text-muted-foreground">Weeks</span>
                    <span className="text-right font-semibold">{card.weekStart}\u2013{card.weekEnd}</span>
                    <span className="text-muted-foreground">Level</span>
                    <span className="text-right font-semibold">{card.level}</span>
                    <span className="text-muted-foreground">Institution</span>
                    <span className="text-right font-semibold">{card.institution}</span>
                </div>
            </div>
        </div>
    );
}

function FormatExampleCard({ example, isExpanded, onToggle }: { example: FormatExample; isExpanded: boolean; onToggle: () => void }) {
    const contextTypeColors: Record<string, string> = {
        passage: 'var(--primary)',
        diagram: 'var(--warning)',
        table: 'var(--destructive)',
    };
    const accentColor = example.contextType ? (contextTypeColors[example.contextType] ?? 'var(--primary)') : 'var(--primary)';

    return (
        <div className="rounded-[var(--card-radius)] border border-border bg-card overflow-hidden transition-all duration-200">
            <button
                onClick={onToggle}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--bg-raised)]"
            >
                <span className={'inline-block text-[10px] transition-transform duration-150' + (isExpanded ? ' rotate-90' : '')} style={{ color: accentColor }}>
                    {'\u25B6'}
                </span>
                <div className="flex-1">
                    <span className="text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{example.title}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{example.examSource}</span>
                </div>
                {example.contextType && <SpBadge variant="neutral" className="text-[9px]">{example.contextType}</SpBadge>}
            </button>

            {isExpanded && (
                <div className="border-t border-border px-5 py-4 space-y-4">
                    <p className="text-[12px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{example.description}</p>

                    {example.context && <ContextCard context={example.context} />}

                    {example.contexts && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {example.contexts.length} Source Documents
                            </p>
                            {example.contexts.map((ctx) => (
                                <ContextCard key={ctx.id} context={ctx} />
                            ))}
                        </div>
                    )}

                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Derived Questions
                        </p>
                        {example.questions.map((q) => (
                            <QuestionRenderer key={q.number} q={q} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ArchitectureShowcase() {
    const { appearance, updateAppearance } = useAppearance();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
    const [selectedElective, setSelectedElective] = useState('CSC 447');
    const [expandedFormats, setExpandedFormats] = useState<Record<number, boolean>>({ 0: true, 3: true, 8: true });
    const [selectedSystem, setSelectedSystem] = useState(0);
    const [selectedTertiaryCountry, setSelectedTertiaryCountry] = useState(0);
    const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
    const [miniSelectedDate, setMiniSelectedDate] = useState<Date | undefined>(undefined);
    const [examSetupOpen, setExamSetupOpen] = useState(false);
    const [examDayModalOpen, setExamDayModalOpen] = useState(false);
    const [examDayModalDate, setExamDayModalDate] = useState('');

    const examPeriod = useExamPeriod();
    const fullCalendar = useCalendar();
    const syncedCalendar = useCalendar();

    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth();

    function makeDateKey(daysFromToday: number): string {
        const d = new Date(thisYear, thisMonth, today.getDate() + daysFromToday);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (!examPeriod.period && examPeriod.entries.length === 0) {
        const periodStart = makeDateKey(2);
        const periodEnd = makeDateKey(22);
        examPeriod.setPeriod({ label: 'Second Semester Finals', startDate: periodStart, endDate: periodEnd });

        const mockExams: { daysOffset: number; courseCode: string; courseName: string; time: string }[] = [
            { daysOffset: 3, courseCode: 'CHM 201', courseName: 'Organic Chemistry', time: '09:00' },
            { daysOffset: 5, courseCode: 'MTH 211', courseName: 'Linear Algebra', time: '09:00' },
            { daysOffset: 5, courseCode: 'CSC 201', courseName: 'Data Structures', time: '14:00' },
            { daysOffset: 8, courseCode: 'PHY 201', courseName: 'Classical Mechanics', time: '10:00' },
            { daysOffset: 12, courseCode: 'ENG 211', courseName: 'Technical Writing', time: '09:00' },
            { daysOffset: 12, courseCode: 'BIO 203', courseName: 'Microbiology', time: '14:00' },
            { daysOffset: 12, courseCode: 'STA 201', courseName: 'Statistics', time: '16:00' },
            { daysOffset: 18, courseCode: 'CSC 311', courseName: 'Operating Systems', time: '09:00' },
        ];
        for (const exam of mockExams) {
            examPeriod.addEntry({
                date: makeDateKey(exam.daysOffset),
                time: exam.time,
                courseCode: exam.courseCode,
                courseName: exam.courseName,
                venue: '',
                notes: '',
            });
        }
    }

    const MOCK_COURSES = [
        { code: 'CHM 201', name: 'Organic Chemistry' },
        { code: 'MTH 211', name: 'Linear Algebra' },
        { code: 'CSC 201', name: 'Data Structures' },
        { code: 'PHY 201', name: 'Classical Mechanics' },
        { code: 'ENG 211', name: 'Technical Writing' },
        { code: 'BIO 203', name: 'Microbiology' },
        { code: 'STA 201', name: 'Statistics' },
        { code: 'CSC 311', name: 'Operating Systems' },
    ];

    const MINI_EVENT_DATES = new Map<string, CalendarMiniEvent>();
    for (const entry of examPeriod.entries) {
        const existing = MINI_EVENT_DATES.get(entry.date);
        MINI_EVENT_DATES.set(entry.date, { count: (existing?.count ?? 0) + 1, variant: 'danger' });
    }

    const REVIEW_HEATMAP = new Map<string, number>();
    for (let i = 0; i < 28; i++) {
        const d = new Date(thisYear, thisMonth, today.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = Math.max(0, Math.floor(Math.random() * 15) - 3);
        if (count > 0) REVIEW_HEATMAP.set(key, count);
    }

    function handleToggle(id: string) {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    const modes = [
        { key: 'light' as const, label: 'Light', desc: 'Warm Editorial' },
        { key: 'dark' as const, label: 'Dark', desc: 'Warm Editorial' },
        { key: 'reader' as const, label: 'Reader', desc: 'Midnight Scholar' },
    ];

    return (
        <>
            <Head title="Architecture Redesign Showcase" />

            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                {/* Theme Switcher */}
                <div className="fixed top-4 right-4 z-50 flex gap-[2px] rounded-xl border border-border bg-card p-[3px] shadow-lg backdrop-blur-xl">
                    {modes.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => updateAppearance(m.key)}
                            className={
                                'cursor-pointer rounded-[9px] px-[14px] py-[7px] text-[12px] font-semibold transition-all duration-200'
                                + (appearance === m.key
                                    ? ' bg-primary text-primary-foreground shadow-sm'
                                    : ' text-muted-foreground hover:text-foreground')
                            }
                            style={{ fontFamily: 'var(--font-body)' }}
                            title={m.desc}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Hero */}
                <section
                    className="relative overflow-hidden px-10 pt-[72px] pb-[52px] max-md:px-4 max-md:pt-12 max-md:pb-9"
                    style={{ background: 'var(--bg-hero)' }}
                >
                    <div
                        className="absolute inset-0 reader:hidden"
                        style={{ background: 'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)' }}
                    />
                    <div
                        className="pointer-events-none absolute -top-[200px] left-1/2 hidden h-[600px] w-[800px] -translate-x-1/2 rounded-full reader:block"
                        style={{ background: 'radial-gradient(circle, rgba(62,189,147,0.08) 0%, transparent 70%)' }}
                    />

                    <div className="relative z-[1] mx-auto max-w-[1200px]">
                        <div
                            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-[14px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] reader:border-[rgba(62,189,147,0.2)] reader:bg-[rgba(62,189,147,0.1)] reader:text-[#3EBD93]"
                            style={{ color: 'var(--canopy-300)', fontFamily: 'var(--font-body)', animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
                        >
                            <span className="h-[6px] w-[6px] rounded-full" style={{ background: 'var(--primary)' }} />
                            Architecture Redesign
                        </div>

                        <h1
                            className="text-white"
                            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}
                        >
                            Three-Layer{' '}
                            <span className="italic text-[var(--honey-400)] reader:bg-gradient-to-br reader:from-[#3EBD93] reader:to-[#65D6AD] reader:bg-clip-text reader:not-italic reader:text-transparent">
                                Evolution
                            </span>
                        </h1>

                        <p
                            className="mt-4 max-w-[600px] text-white/45 reader:italic"
                            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.6, animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both' }}
                        >
                            Block-based topics, curriculum mapping, and hierarchical question papers.
                            A visual walkthrough of the proposed architecture changes that will
                            transform how content, courses, and questions interconnect.
                        </p>
                    </div>
                </section>

                <div className="mx-auto max-w-[1200px] px-10 max-md:px-4">
                    {/* Overview Cards */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                { emoji: '\uD83E\uDDE9', title: 'Block-Based Topics', desc: 'Break monolithic topics into 5\u201310 minute learning blocks with hierarchy, difficulty levels, and Bloom\u2019s taxonomy.', metric: `${TOTAL_LEAF_BLOCKS} blocks`, metricLabel: 'in Data Structures alone', href: '#blocks' },
                                { emoji: '\uD83C\uDFEB', title: 'Curriculum Mapping', desc: 'Map courses to specific blocks at specific depths. Model borrowed courses, elective groups, and prerequisite chains.', metric: '40\u201360%', metricLabel: 'of courses are borrowed', href: '#curriculum' },
                                { emoji: '\uD83D\uDCDD', title: 'Question Hierarchy', desc: '15 question types, shared contexts, multi-level nesting, and international format support from SAT to JEE.', metric: '15 types', metricLabel: 'of question formats', href: '#questions' },
                                { emoji: '\uD83C\uDF0D', title: 'Global-Ready Model', desc: 'Education system as a first-class entity. Add any country\u2019s school structure with zero migrations \u2014 just seed data.', metric: `${EDUCATION_SYSTEMS.length} systems`, metricLabel: 'modeled in one schema', href: '#global' },
                            ].map((card) => (
                                <a
                                    key={card.title}
                                    href={card.href}
                                    className="group block rounded-[var(--card-radius)] border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="mb-3 text-2xl">{card.emoji}</div>
                                    <h3 className="text-[16px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{card.title}</h3>
                                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        {card.desc}
                                    </p>
                                    <div className="mt-4 border-t border-border/50 pt-3">
                                        <span className="text-[22px] font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>{card.metric}</span>
                                        <span className="ml-2 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{card.metricLabel}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* Section 1: Block-Based Topics */}
                    <section id="blocks" className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Content Architecture</SectionLabel>
                        <SectionTitle>Block-Based Topic Structure</SectionTitle>

                        {/* Before / After */}
                        <div className="mb-10 grid gap-6 md:grid-cols-2">
                            {/* Before */}
                            <div className="rounded-[var(--card-radius)] border border-border bg-card">
                                <div className="border-b border-border px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <SpBadge variant="danger">Current</SpBadge>
                                        <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Monolithic Topic</span>
                                    </div>
                                </div>
                                <div className="relative h-[240px] overflow-hidden px-5 py-4">
                                    <div className="space-y-2 opacity-40">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className="h-3 rounded bg-muted-foreground/10" style={{ width: `${60 + Math.random() * 40}%` }} />
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-card/80 to-card">
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">{'\uD83D\uDCC3'}</div>
                                            <p className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>One giant blob</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>50+ pages, no granularity, no direct linking</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* After */}
                            <div className="rounded-[var(--card-radius)] border border-border bg-card">
                                <div className="border-b border-border px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <SpBadge variant="primary">Proposed</SpBadge>
                                        <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Block-Based Structure</span>
                                    </div>
                                </div>
                                <div className="px-5 py-4">
                                    <div className="flex items-baseline justify-between mb-3">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>CIT 204: Data Structures</span>
                                        <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{TOTAL_LEAF_BLOCKS} blocks {'\u00B7'} 5 levels</span>
                                    </div>
                                    <div className="space-y-0.5 text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {DSA_TREE.children.map((child) => (
                                            <div key={child.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-[var(--bg-raised)]">
                                                <span className="text-muted-foreground">{child.path}</span>
                                                <BlockTypeIcon type={child.blockType} />
                                                <span className="font-medium">{child.title}</span>
                                                <span className="ml-auto text-muted-foreground">{countBlocks(child)} blocks</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tree Explorer */}
                        <div className="mb-8 rounded-[var(--card-radius)] border border-border bg-card">
                            <div className="border-b border-border px-5 py-3">
                                <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                                    {'\uD83C\uDF33'} Interactive Block Explorer
                                </span>
                                <span className="ml-2 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    Click to expand {'\u00B7'} Select any block to see its metadata
                                </span>
                            </div>
                            <div className="grid md:grid-cols-[1fr_300px]">
                                <div className="max-h-[500px] overflow-y-auto border-r border-border p-3">
                                    {DSA_TREE.children.map((child) => (
                                        <TreeNode
                                            key={child.id}
                                            block={child}
                                            expanded={expanded}
                                            selectedId={selectedBlock?.id ?? null}
                                            onToggle={handleToggle}
                                            onSelect={setSelectedBlock}
                                        />
                                    ))}
                                </div>
                                <div className="p-5">
                                    <BlockDetailPanel block={selectedBlock} />
                                </div>
                            </div>
                        </div>

                        {/* Why This Matters */}
                        <div className="grid gap-3 md:grid-cols-4">
                            {[
                                { icon: '\uD83C\uDFAF', title: 'Direct Linking', desc: 'Students jump to "Linked Lists: Insertion" directly \u2014 no wading through 50 pages' },
                                { icon: '\uD83D\uDD17', title: '10x Question Mapping', desc: 'Link questions to exact 5-min blocks, not entire topics' },
                                { icon: '\uD83E\uDDE0', title: 'Smart Learning Paths', desc: 'Block prerequisites create natural study sequences' },
                                { icon: '\uD83D\uDCCA', title: 'Granular Progress', desc: '"18/79 blocks done" not just "topic started"' },
                            ].map((card) => (
                                <div key={card.title} className="rounded-[var(--card-radius)] border border-border bg-card p-4">
                                    <div className="mb-2 text-xl">{card.icon}</div>
                                    <h4 className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>{card.title}</h4>
                                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: Curriculum Mapping */}
                    <section id="curriculum" className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Curriculum Architecture</SectionLabel>
                        <SectionTitle>Course-to-Block Mapping & Curriculum Model</SectionTitle>

                        {/* Sub A: Coverage Cards */}
                        <div className="mb-4">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Same topic, different courses, different coverage
                            </p>
                        </div>
                        <div className="mb-10 grid gap-4 md:grid-cols-3">
                            {COVERAGE_CARDS.map((card) => (
                                <CoverageCardComponent key={card.courseCode} card={card} />
                            ))}
                        </div>
                        <div className="mb-12 rounded-lg border border-primary/20 bg-primary/5 px-5 py-3">
                            <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                <strong>Key insight:</strong> CSC 111 (100L) and CSC 224 (200L) both touch "Data Structures" \u2014 but CSC 111 only teaches 12% at an introductory level (weeks 5\u20136), while CSC 224 teaches 53% at intermediate depth across the full semester. The block-based model captures this nuance.
                            </p>
                        </div>

                        {/* Sub B: Borrowed Courses */}
                        <div className="mb-10">
                            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Borrowed course structure {'\u2014'} UNIOSUN CS 100L First Semester (24 units)
                            </p>
                            <div className="space-y-3">
                                {BORROWED_COURSES.map((group) => (
                                    <div key={group.category} className="rounded-[var(--card-radius)] border border-border bg-card overflow-hidden">
                                        <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: group.color }} />
                                            <span className="text-[12px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>{group.category}</span>
                                            <span className="ml-auto text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                                {group.courses.reduce((acc, c) => acc + c.units, 0)} units
                                            </span>
                                        </div>
                                        <div className="divide-y divide-border/40">
                                            {group.courses.map((course) => (
                                                <div key={course.code} className="flex items-center gap-4 px-5 py-2">
                                                    <span className="w-[70px] shrink-0 text-[12px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>{course.code}</span>
                                                    <span className="flex-1 text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>{course.name}</span>
                                                    <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{course.fromDept}</span>
                                                    <SpBadge variant="neutral" className="text-[9px]">{course.units}u</SpBadge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-5 py-3">
                                <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                    <strong>Only 1 of 24 units is a CS major course.</strong> The current model has no concept of "required ancillary" \u2014 it can\u2019t distinguish GST 111 (university-wide) from MTH 101 (Math dept, required for CS majors).
                                </p>
                            </div>
                        </div>

                        {/* Sub C: Elective Groups */}
                        <div className="mb-10">
                            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Elective group {'\u2014'} UNIOSUN CS 400L First Semester
                            </p>
                            <div className="max-w-md rounded-[var(--card-radius)] border border-border bg-card p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Choose ONE (2 units)</h4>
                                    <div className="flex gap-2">
                                        <SpBadge variant="neutral">Min: 1</SpBadge>
                                        <SpBadge variant="neutral">Max: 1</SpBadge>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    {ELECTIVE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            onClick={() => setSelectedElective(opt.code)}
                                            className={
                                                'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-all duration-150'
                                                + (selectedElective === opt.code
                                                    ? ' border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)]'
                                                    : ' border-border hover:border-[var(--opt-hover-border)] hover:bg-[var(--opt-hover-bg)]')
                                            }
                                        >
                                            <span className={
                                                'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors'
                                                + (selectedElective === opt.code
                                                    ? ' bg-[var(--opt-correct-dot)] text-white'
                                                    : ' border border-border bg-[var(--bg-raised)]')
                                            }>
                                                {selectedElective === opt.code ? '\u2713' : ''}
                                            </span>
                                            <span className="flex-1">
                                                <span className="text-[12px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>{opt.code}</span>
                                                <span className="ml-2 text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>{opt.name}</span>
                                            </span>
                                            <SpBadge variant="neutral" className="text-[9px]">{opt.units}u</SpBadge>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sub D: Prerequisite Chain */}
                        <div>
                            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Prerequisite chains
                            </p>
                            <div className="space-y-6">
                                {PREREQ_CHAINS.map((chain, ci) => (
                                    <div key={ci} className="rounded-[var(--card-radius)] border border-border bg-card p-5">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {chain.nodes.map((node, ni) => (
                                                <div key={node.code} className="flex items-center gap-3">
                                                    <div className="rounded-lg border border-border bg-[var(--bg-raised)] px-4 py-2.5 text-center">
                                                        <div className="text-[13px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>{node.code}</div>
                                                        <div className="mt-0.5 max-w-[120px] text-[10px] leading-tight text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{node.title}</div>
                                                        <SpBadge variant="neutral" className="mt-1 text-[9px]">{node.level}</SpBadge>
                                                    </div>
                                                    {ni < chain.nodes.length - 1 && chain.links.some(([from]) => from === ni) && (
                                                        <span className="text-[16px] text-primary">{'\u2192'}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {ci === 1 && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <SpBadge variant="reward" className="text-[9px]">cross-department</SpBadge>
                                                <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Mathematics {'\u2192'} Computer Science requirement</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Question Hierarchy */}
                    <section id="questions" className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Question Architecture</SectionLabel>
                        <SectionTitle>Hierarchical Question Papers</SectionTitle>

                        <div className="mb-10 grid gap-6 md:grid-cols-2">
                            {/* Before: Flat */}
                            <div className="rounded-[var(--card-radius)] border border-border bg-card">
                                <div className="border-b border-border px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <SpBadge variant="danger">Current</SpBadge>
                                        <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Flat Question Model</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-0">
                                        {FLAT_QUESTIONS.map((q) => (
                                            <div key={q.num} className="flex items-center gap-3 border-b border-border/30 px-3 py-2 last:border-b-0">
                                                <span className="w-5 shrink-0 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>#{q.num}</span>
                                                <span className="flex-1 truncate text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>{q.text}</span>
                                                <SpBadge variant={q.type === 'mcq' ? 'solid' : 'primary'} className="text-[9px] px-[5px] py-0">{q.type}</SpBadge>
                                                <span className="w-8 text-right text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{q.marks}m</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-1.5">
                                        {[
                                            'No paper grouping',
                                            'No parent-child relationships',
                                            'No sections (A, B)',
                                            'No question numbering (1a, 1b)',
                                            'Original structure lost',
                                        ].map((issue) => (
                                            <div key={issue} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                <span className="text-[var(--destructive)]">{'\u26A0'}</span>
                                                <span className="text-muted-foreground">{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* After: Hierarchical */}
                            <div className="rounded-[var(--card-radius)] border border-border bg-card">
                                <div className="border-b border-border px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <SpBadge variant="primary">Proposed</SpBadge>
                                        <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Hierarchical Paper</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {/* Paper Header */}
                                    <div className="mb-4 rounded-lg px-4 py-3" style={{ background: 'var(--bg-hero)' }}>
                                        <div className="text-[14px] font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>CSC 212 {'\u2014'} Data Structures</div>
                                        <div className="mt-0.5 flex gap-3 text-[11px] text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
                                            <span>2023</span>
                                            <span>Second Semester</span>
                                            <span>MOUAU</span>
                                            <span>100 marks</span>
                                            <span>3 hours</span>
                                        </div>
                                    </div>

                                    {/* Sections */}
                                    <div className="max-h-[400px] space-y-4 overflow-y-auto">
                                        {PAPER_QUESTIONS.map((section) => (
                                            <div key={section.section}>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span
                                                        className="rounded px-2 py-0.5 text-[11px] font-bold text-white"
                                                        style={{ background: section.section === 'A' ? 'var(--primary)' : 'var(--destructive)', fontFamily: 'var(--font-body)' }}
                                                    >
                                                        Section {section.section}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                                        {section.instruction} ({section.marks} marks)
                                                    </span>
                                                </div>
                                                <div>
                                                    {section.questions.map((q) => (
                                                        <QuestionRenderer key={q.number} q={q} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Why This Matters */}
                        <div className="grid gap-3 md:grid-cols-3">
                            {[
                                { icon: '\uD83C\uDFAF', title: 'Authentic Practice', desc: 'Students practice complete papers in original structure \u2014 Section A mandatory, choose 2 from Section B' },
                                { icon: '\uD83E\uDD16', title: 'AI Grading Ready', desc: 'Structured marking schemes at every nesting level enable precise automated grading (Phase 2)' },
                                { icon: '\uD83E\uDD1D', title: 'Content Trust', desc: 'Students recognize their actual exam paper \u2014 builds trust in the platform\u2019s data quality' },
                            ].map((card) => (
                                <div key={card.title} className="rounded-[var(--card-radius)] border border-border bg-card p-4">
                                    <div className="mb-2 text-xl">{card.icon}</div>
                                    <h4 className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>{card.title}</h4>
                                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 3.5: Question Format Gallery */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Question Format System</SectionLabel>
                        <SectionTitle>Every Format, One Unified Model</SectionTitle>

                        <p className="mb-6 max-w-[700px] text-[14px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Real exams use passages, diagrams, data tables, matching pairs, and more. The proposed system handles all of these through shared contexts, a 15-type question enum, multi-context references, and multi-level nesting where a question can be both answerable and have sub-questions. Designed to cover Nigerian (WAEC/NECO/JAMB), Indian (CBSE/JEE/NEET), UK (GCSE/A-Level/IB), US (SAT/GRE/AP), and professional exams.
                        </p>

                        {/* Type Overview Grid */}
                        <div className="mb-8">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                15 Question Response Types
                            </p>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
                                {Object.entries(QUESTION_TYPE_META).filter(([k]) => k !== 'group').map(([key, meta]) => (
                                    <div key={key} className="rounded-lg border border-border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm">
                                        <SpBadge variant={meta.variant} className="text-[9px] mb-1.5">{meta.label}</SpBadge>
                                        <div className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{key}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Context Types */}
                        <div className="mb-8">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                9 Shared Context Types
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['passage', 'diagram', 'table', 'case_study', 'code_snippet', 'map', 'graph', 'word_bank', 'equation_set'].map((ct) => (
                                    <div key={ct} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                                        <span className="text-[12px]">
                                            {ct === 'passage' ? '\uD83D\uDCC4' : ct === 'diagram' ? '\uD83D\uDDBC\uFE0F' : ct === 'table' ? '\uD83D\uDCCA' : ct === 'case_study' ? '\uD83D\uDCCB' : ct === 'code_snippet' ? '\uD83D\uDCBB' : ct === 'map' ? '\uD83D\uDDFA\uFE0F' : ct === 'graph' ? '\uD83D\uDCC8' : ct === 'word_bank' ? '\uD83D\uDCD6' : '\uD83E\uDDEE'}
                                        </span>
                                        <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>{ct.replace('_', ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dual-Nature Callout */}
                        <div className="mb-8 rounded-lg border-2 border-primary/30 bg-primary/5 px-5 py-4">
                            <h4 className="mb-2 text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                Dual-Nature Questions
                            </h4>
                            <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-content)' }}>
                                A question can be <strong className="text-foreground">both answerable and a parent</strong>. Question 1 might say "State the time complexities for each algorithm" (worth 5 marks on its own), while also having sub-questions 1(a), 1(b), 1(b)(i). The parent is not just a container &mdash; it carries its own content and marks.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5">
                                    <span className="text-[11px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>Q1</span>
                                    <SpBadge variant="primary" className="text-[8px]">theory</SpBadge>
                                    <span className="text-[10px] text-muted-foreground">5m</span>
                                </div>
                                <span className="text-muted-foreground">{'\u2192'}</span>
                                <div className="flex gap-1">
                                    {['1(a)', '1(b)'].map((n) => (
                                        <span key={n} className="rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>{n}</span>
                                    ))}
                                </div>
                                <span className="text-muted-foreground">{'\u2192'}</span>
                                <div className="flex gap-1">
                                    {['1(b)(i)', '1(b)(ii)'].map((n) => (
                                        <span key={n} className="rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>{n}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Format Examples (Expandable) */}
                        <div className="mb-8">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Real-World Format Examples {'\u2014'} click to expand
                            </p>
                            <div className="space-y-2">
                                {FORMAT_EXAMPLES.map((example, i) => (
                                    <FormatExampleCard
                                        key={i}
                                        example={example}
                                        isExpanded={!!expandedFormats[i]}
                                        onToggle={() => setExpandedFormats((prev) => ({ ...prev, [i]: !prev[i] }))}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Schema Overview */}
                        <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
                            <h4 className="mb-4 text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Proposed Schema Overview</h4>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-lg border border-border bg-[var(--bg-raised)] p-4">
                                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary" style={{ fontFamily: 'var(--font-body)' }}>question_papers</div>
                                    <div className="space-y-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {['id', 'institution_course_id', 'exam_type_id', 'academic_session', 'semester', 'total_marks', 'duration_minutes'].map((f) => (
                                            <div key={f} className="flex items-center gap-1.5 text-muted-foreground">
                                                <span className="h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border bg-[var(--bg-raised)] p-4">
                                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--warning)]" style={{ fontFamily: 'var(--font-body)' }}>question_contexts</div>
                                    <div className="space-y-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {['id', 'context_type (enum)', 'title', 'content (text)', 'media_url', 'table_data (jsonb)', 'word_bank (jsonb)'].map((f) => (
                                            <div key={f} className="flex items-center gap-1.5 text-muted-foreground">
                                                <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--warning)]/60" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border bg-[var(--bg-raised)] p-4">
                                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--canopy-400)]" style={{ fontFamily: 'var(--font-body)' }}>question_context_links</div>
                                    <div className="space-y-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {['question_id (FK)', 'question_context_id (FK)', 'sort_order', 'label (e.g. "Source 1")'].map((f) => (
                                            <div key={f} className="flex items-center gap-1.5 text-muted-foreground">
                                                <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--canopy-400)]/60" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 rounded border border-[var(--canopy-400)]/20 bg-[var(--canopy-400)]/5 px-2 py-1">
                                        <span className="text-[9px] font-bold text-[var(--canopy-400)]" style={{ fontFamily: 'var(--font-body)' }}>many-to-many pivot</span>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border bg-[var(--bg-raised)] p-4">
                                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--destructive)]" style={{ fontFamily: 'var(--font-body)' }}>questions (expanded)</div>
                                    <div className="space-y-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                        {['parent_question_id (self-ref)', 'question_paper_id', 'section', 'question_number', 'display_label', 'question_type (15 types)', 'content', 'marks', 'response_config (jsonb)', 'choice_group (jsonb)'].map((f) => (
                                            <div key={f} className="flex items-center gap-1.5 text-muted-foreground">
                                                <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--destructive)]/60" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                                    <p className="text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                        <strong>response_config</strong> is a JSONB column that stores format-specific data: MCQ options, assertion/reason pairs, matching pairs + distractors, matrix mappings (many-to-many), ordering items, cloze gap options, diagram label positions, numeric answers + tolerance, calculation answers + units. Each question type has its own schema validated at the application layer.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-[var(--canopy-400)]/20 bg-[var(--canopy-400)]/5 px-4 py-3">
                                    <p className="text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                        <strong>question_context_links</strong> replaces a single context_id FK. A question can reference multiple contexts (DBQ with 5 source documents), and a context can be shared across multiple questions. The pivot table stores the relationship with ordering and optional labels.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Connecting the Dots */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>The Full Picture</SectionLabel>
                        <SectionTitle>Question {'\u2192'} Block {'\u2192'} Course Mapping</SectionTitle>

                        {/* Connection Diagram */}
                        <div className="mb-8 rounded-[var(--card-radius)] border border-border bg-card p-6">
                            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                                {/* Question */}
                                <div className="w-[200px] rounded-lg border-2 border-[var(--destructive)]/30 bg-[var(--destructive)]/5 p-4">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--destructive)]" style={{ fontFamily: 'var(--font-body)' }}>Question</div>
                                    <div className="text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>1(a)</div>
                                    <p className="mt-1 text-[12px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                        "Define the term Abstract Data Type"
                                    </p>
                                    <div className="mt-2 flex gap-2">
                                        <SpBadge variant="primary" className="text-[9px]">theory</SpBadge>
                                        <SpBadge variant="neutral" className="text-[9px]">2 marks</SpBadge>
                                    </div>
                                </div>

                                <div className="text-2xl text-primary">{'\u2192'}</div>

                                {/* Block */}
                                <div className="w-[200px] rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary" style={{ fontFamily: 'var(--font-body)' }}>Content Block</div>
                                    <div className="text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Abstract Data Types</div>
                                    <p className="mt-1 text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Path: 1.1 {'\u00B7'} 6 min read</p>
                                    <div className="mt-2 flex gap-2">
                                        <SpBadge variant="primary" className="text-[9px]">beginner</SpBadge>
                                        <SpBadge variant="neutral" className="text-[9px]">text</SpBadge>
                                    </div>
                                </div>

                                <div className="text-2xl text-primary">{'\u2190'}</div>

                                {/* Course */}
                                <div className="w-[200px] rounded-lg border-2 border-[var(--warning)]/30 bg-[var(--warning)]/5 p-4">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--warning)]" style={{ fontFamily: 'var(--font-body)' }}>Course</div>
                                    <div className="text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>CSC 224</div>
                                    <p className="mt-1 text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Data Structures {'\u00B7'} 200L</p>
                                    <div className="mt-2 flex gap-2">
                                        <SpBadge variant="reward" className="text-[9px]">intermediate</SpBadge>
                                        <SpBadge variant="neutral" className="text-[9px]">Week 1</SpBadge>
                                    </div>
                                </div>
                            </div>

                            <div className="mx-auto mt-6 max-w-lg text-center">
                                <div className="space-y-1 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    <p>Also taught in: <strong className="text-foreground">CSC 111</strong> (surface mention) {'\u00B7'} <strong className="text-foreground">CSC 311</strong> (reference)</p>
                                    <p>Related blocks: <strong className="text-foreground">Stack ADT</strong> {'\u00B7'} <strong className="text-foreground">Queue ADT</strong> {'\u00B7'} <strong className="text-foreground">BST ADT</strong></p>
                                    <p>Related questions: <strong className="text-foreground">Q2(b)(i)</strong> {'\u00B7'} <strong className="text-foreground">Q4(a)</strong></p>
                                </div>
                            </div>
                        </div>

                        {/* Student Flow */}
                        <div className="rounded-[var(--card-radius)] border border-primary/20 bg-primary/5 p-6">
                            <h4 className="mb-4 text-[15px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Student Experience Flow</h4>
                            <div className="space-y-3">
                                {[
                                    { step: '1', text: 'Student is stuck on question 1(a): "Define Abstract Data Type"', color: 'var(--destructive)' },
                                    { step: '2', text: 'System finds the exact block: "Abstract Data Types" (6 min read, beginner)', color: 'var(--primary)' },
                                    { step: '3', text: 'Student reads the precise content they need \u2014 not a 50-page topic dump', color: 'var(--primary)' },
                                    { step: '4', text: 'System suggests: "Try Q2(b)(i) next \u2014 same block, tests the same concept"', color: 'var(--warning)' },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3">
                                        <span
                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                            style={{ background: item.color }}
                                        >
                                            {item.step}
                                        </span>
                                        <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mx-auto max-w-[1200px] px-10 max-md:px-4">
                    {/* Section 5: Global-Ready Architecture */}
                    <section id="global" className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Global Architecture</SectionLabel>
                        <SectionTitle>One Schema, Every Education System</SectionTitle>

                        <p className="mb-8 max-w-[700px] text-[14px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Instead of hardcoding Nigerian education structures as PHP enums, make Education System a first-class entity. Adding a new country means seeding rows, not writing migrations or changing code.
                        </p>

                        {/* Before/After: Enums → Tables */}
                        <div className="mb-10 grid gap-6 md:grid-cols-2">
                            <div className="rounded-[var(--card-radius)] border border-border bg-card">
                                <div className="border-b border-border px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <SpBadge variant="danger">Current</SpBadge>
                                        <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Hardcoded PHP Enums</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {ENUM_COMPARISONS.map((comp) => (
                                        <div key={comp.current.name} className="rounded-lg border border-border bg-[var(--bg-raised)] p-3">
                                            <div className="mb-1.5 text-[12px] font-bold text-[var(--destructive)]" style={{ fontFamily: 'var(--font-body)' }}>
                                                {comp.current.name}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {comp.current.values.map((v) => (
                                                    <span key={v} className="rounded bg-[var(--destructive)]/10 px-2 py-0.5 text-[10px] font-mono text-[var(--destructive)]">{v}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="space-y-1.5 pt-1">
                                        {[
                                            'Nigeria-only: can\'t represent UK Key Stages',
                                            'Adding Ghana = new enum values + migration',
                                            'Adding India = 30+ boards, enum explodes',
                                            'Cambridge International has no country',
                                        ].map((issue) => (
                                            <div key={issue} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                <span className="text-[var(--destructive)]">{'\u26A0'}</span>
                                                <span className="text-muted-foreground">{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[var(--card-radius)] border border-border bg-card">
                                <div className="border-b border-border px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <SpBadge variant="primary">Proposed</SpBadge>
                                        <span className="text-[13px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Configurable Data Tables</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {ENUM_COMPARISONS.map((comp) => (
                                        <div key={comp.proposed.table} className="rounded-lg border border-border bg-[var(--bg-raised)] p-3">
                                            <div className="mb-1.5 text-[12px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>
                                                {comp.proposed.table}
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{comp.proposed.description}</p>
                                        </div>
                                    ))}
                                    <div className="space-y-1.5 pt-1">
                                        {[
                                            'Any education system fits the same tables',
                                            'Adding a country = seeding rows only',
                                            'Supranational systems (IB, Cambridge) work natively',
                                            'One school can offer multiple systems',
                                        ].map((benefit) => (
                                            <div key={benefit} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                <span className="text-primary">{'\u2713'}</span>
                                                <span className="text-muted-foreground">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Education System Hierarchy */}
                        <div className="mb-10">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                The Universal Hierarchy
                            </p>
                            <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
                                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                                    {[
                                        { label: 'Country', sub: 'or supranational', color: 'var(--muted-foreground)' },
                                        { label: 'Education System', sub: 'NERDC, CBSE, Cambridge...', color: 'var(--primary)' },
                                        { label: 'Curriculum Tier', sub: 'Primary, Secondary, Sixth Form...', color: 'var(--warning)' },
                                        { label: 'Level', sub: 'JSS1, Year 10, Class 11...', color: 'var(--destructive)' },
                                        { label: 'Subject', sub: 'scoped to system + level', color: 'var(--canopy-400)' },
                                    ].map((item, i) => (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <div className="rounded-lg border-2 px-4 py-3 text-center" style={{ borderColor: `${item.color}40`, background: `${item.color}08` }}>
                                                <div className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-display)', color: item.color }}>{item.label}</div>
                                                <div className="mt-0.5 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{item.sub}</div>
                                            </div>
                                            {i < 4 && <span className="text-lg text-muted-foreground">{'\u2192'}</span>}
                                        </div>
                                    ))}
                                </div>
                                <div className="mx-auto mt-4 flex items-center justify-center gap-3">
                                    <div className="rounded-lg border border-dashed border-[var(--warning)]/40 bg-[var(--warning)]/5 px-4 py-2 text-center">
                                        <div className="text-[11px] font-bold text-[var(--warning)]" style={{ fontFamily: 'var(--font-body)' }}>+ Streams</div>
                                        <div className="text-[9px] text-muted-foreground">optional per system</div>
                                    </div>
                                    <div className="rounded-lg border border-dashed border-[var(--destructive)]/40 bg-[var(--destructive)]/5 px-4 py-2 text-center">
                                        <div className="text-[11px] font-bold text-[var(--destructive)]" style={{ fontFamily: 'var(--font-body)' }}>+ Assessments</div>
                                        <div className="text-[9px] text-muted-foreground">WAEC, GCSEs, JEE...</div>
                                    </div>
                                    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-center">
                                        <div className="text-[11px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>+ Calendar Terms</div>
                                        <div className="text-[9px] text-muted-foreground">per institution per year</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Country Comparison */}
                        <div className="mb-10">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Same schema, different data {'\u2014'} click a system to explore
                            </p>
                            <div className="rounded-[var(--card-radius)] border border-border bg-card overflow-hidden">
                                {/* System Tabs */}
                                <div className="flex overflow-x-auto border-b border-border">
                                    {EDUCATION_SYSTEMS.map((sys, i) => (
                                        <button
                                            key={sys.systemName}
                                            onClick={() => setSelectedSystem(i)}
                                            className={
                                                'flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-[12px] font-semibold transition-all'
                                                + (selectedSystem === i
                                                    ? ' border-primary bg-primary/5 text-foreground'
                                                    : ' border-transparent text-muted-foreground hover:text-foreground')
                                            }
                                            style={{ fontFamily: 'var(--font-body)' }}
                                        >
                                            <span className="text-[16px]">{sys.flag}</span>
                                            <span>{sys.country}</span>
                                            {sys.isSupranational && <SpBadge variant="reward" className="text-[8px]">supranational</SpBadge>}
                                        </button>
                                    ))}
                                </div>

                                {/* Selected System Detail */}
                                {(() => {
                                    const sys = EDUCATION_SYSTEMS[selectedSystem];
                                    return (
                                        <div className="p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <span className="text-2xl">{sys.flag}</span>
                                                <div>
                                                    <h4 className="text-[16px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>{sys.systemName}</h4>
                                                    <p className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                                        {sys.country}{sys.isSupranational ? ' \u2014 used in 160+ countries' : ' \u2014 national curriculum'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tiers visualization */}
                                            <div className="space-y-3">
                                                {sys.tiers.map((tier) => (
                                                    <div key={tier.name} className="rounded-lg border border-border overflow-hidden">
                                                        <div className="flex items-center gap-2 border-b border-border px-4 py-2" style={{ background: `${sys.color}08` }}>
                                                            <span className="h-2 w-2 rounded-full" style={{ background: sys.color }} />
                                                            <span className="text-[12px] font-bold" style={{ fontFamily: 'var(--font-body)', color: sys.color }}>{tier.name}</span>
                                                            <span className="ml-auto text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{tier.levels.length} levels</span>
                                                        </div>
                                                        <div className="px-4 py-3 space-y-2">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {tier.levels.map((level) => (
                                                                    <span key={level} className="rounded border border-border bg-[var(--bg-raised)] px-2.5 py-1 text-[11px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                                                        {level}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {tier.streams && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-semibold text-[var(--warning)]" style={{ fontFamily: 'var(--font-body)' }}>Streams:</span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {tier.streams.map((s) => (
                                                                            <SpBadge key={s} variant="reward" className="text-[9px]">{s}</SpBadge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {tier.assessments && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-semibold text-[var(--destructive)]" style={{ fontFamily: 'var(--font-body)' }}>Exams:</span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {tier.assessments.map((a) => (
                                                                            <SpBadge key={a} variant="danger" className="text-[9px]">{a}</SpBadge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Schema Overview */}
                        <div className="mb-10">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Proposed Schema Tables
                            </p>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { name: 'education_systems', color: 'var(--primary)', fields: ['id', 'name', 'slug', 'country_id (nullable)', 'type (national/international/state)'] },
                                    { name: 'curriculum_tiers', color: 'var(--warning)', fields: ['id', 'education_system_id', 'name', 'sort_order'] },
                                    { name: 'education_levels', color: 'var(--destructive)', fields: ['id', 'curriculum_tier_id', 'name', 'display_name', 'sort_order', 'typical_age_min', 'typical_age_max'] },
                                    { name: 'streams', color: 'var(--canopy-400)', fields: ['id', 'education_system_id', 'name', 'applies_from_tier_id'] },
                                    { name: 'curriculum_subjects', color: 'var(--honey-400)', fields: ['id', 'education_system_id', 'name', 'slug', 'discipline_id'] },
                                    { name: 'level_subjects', color: 'var(--ember-400)', fields: ['education_level_id', 'curriculum_subject_id', 'is_compulsory', 'stream_id (nullable)'] },
                                    { name: 'assessment_types', color: 'var(--destructive)', fields: ['id', 'education_system_id', 'name', 'tier_id (nullable)', 'is_exit_exam', 'grading_scale_id'] },
                                    { name: 'calendar_terms', color: 'var(--primary)', fields: ['id', 'institution_id', 'academic_year', 'name', 'start_date', 'end_date', 'sort_order'] },
                                    { name: 'institution_types', color: 'var(--canopy-400)', fields: ['id', 'country_id', 'name', 'slug', 'level_progression (jsonb)', 'credit_system', 'grading_scale_id'] },
                                    { name: 'grading_scales', color: 'var(--warning)', fields: ['id', 'name', 'scale_max', 'grade_boundaries (jsonb)', 'classification_labels (jsonb)'] },
                                ].map((table) => (
                                    <div key={table.name} className="rounded-lg border border-border bg-[var(--bg-raised)] p-3">
                                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)', color: table.color }}>{table.name}</div>
                                        <div className="space-y-0.5 text-[10px]" style={{ fontFamily: 'var(--font-body)' }}>
                                            {table.fields.map((f) => (
                                                <div key={f} className="flex items-center gap-1.5 text-muted-foreground">
                                                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: `${table.color}60` }} />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* "Add a Country" Flow */}
                        <div className="mb-10 rounded-[var(--card-radius)] border border-primary/20 bg-primary/5 p-6">
                            <h4 className="mb-4 text-[15px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Adding Ghana: Zero Migrations Required</h4>
                            <div className="space-y-3">
                                {[
                                    { step: '1', text: 'Seed education_systems: "Ghana Education Service" with country_id for Ghana', color: 'var(--primary)' },
                                    { step: '2', text: 'Seed curriculum_tiers: "Primary", "Junior High", "Senior High"', color: 'var(--warning)' },
                                    { step: '3', text: 'Seed education_levels: JHS 1, JHS 2, JHS 3, SHS 1, SHS 2, SHS 3', color: 'var(--destructive)' },
                                    { step: '4', text: 'Seed streams: "General Science", "General Arts", "Business", "Home Economics", "Visual Arts", "Technical"', color: 'var(--canopy-400)' },
                                    { step: '5', text: 'Seed curriculum_subjects: Mathematics, English, Integrated Science, Social Studies...', color: 'var(--honey-400)' },
                                    { step: '6', text: 'Seed assessment_types: BECE, WASSCE (with Ghanaian grading scale)', color: 'var(--ember-400)' },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3">
                                        <span
                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                            style={{ background: item.color }}
                                        >
                                            {item.step}
                                        </span>
                                        <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2">
                                <span className="text-lg">{'\u2705'}</span>
                                <span className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>Result: Ghanaian students can register, pick their JHS/SHS level, choose streams, and access BECE/WASSCE prep.</span>
                            </div>
                        </div>

                        {/* Tertiary Institution Types */}
                        <div className="mb-10">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Tertiary / Higher Education {'\u2014'} not just universities
                            </p>
                            <div className="rounded-[var(--card-radius)] border border-border bg-card overflow-hidden">
                                <div className="border-b border-border px-5 py-3">
                                    <p className="text-[13px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        Higher education is not just universities. Nigerian Polytechnics use ND/HND levels with a 4.0 GPA scale. US Community Colleges grant Associate degrees. German Fachhochschulen focus on applied sciences. The <strong className="text-foreground">institution_type</strong> determines level progression, grading scale, and credit system.
                                    </p>
                                </div>

                                {/* Country tabs */}
                                <div className="flex overflow-x-auto border-b border-border">
                                    {TERTIARY_SYSTEMS.map((sys, i) => (
                                        <button
                                            key={sys.country}
                                            onClick={() => setSelectedTertiaryCountry(i)}
                                            className={
                                                'flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-5 py-2.5 text-[12px] font-semibold transition-all'
                                                + (selectedTertiaryCountry === i
                                                    ? ' border-primary bg-primary/5 text-foreground'
                                                    : ' border-transparent text-muted-foreground hover:text-foreground')
                                            }
                                            style={{ fontFamily: 'var(--font-body)' }}
                                        >
                                            <span className="text-[14px]">{sys.flag}</span>
                                            <span>{sys.country}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Selected country detail */}
                                {(() => {
                                    const sys = TERTIARY_SYSTEMS[selectedTertiaryCountry];
                                    return (
                                        <div className="p-5 space-y-3">
                                            {sys.types.map((type) => (
                                                <div key={type.name} className="rounded-lg border border-border overflow-hidden">
                                                    <div className="flex items-center gap-2 border-b border-border px-4 py-2" style={{ background: `${type.color}08` }}>
                                                        <span className="h-2 w-2 rounded-full" style={{ background: type.color }} />
                                                        <span className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-display)', color: type.color }}>{type.name}</span>
                                                        <span className="ml-auto text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{type.examples}</span>
                                                    </div>
                                                    <div className="px-4 py-3">
                                                        <div className="mb-2 flex flex-wrap gap-1.5">
                                                            {type.levels.map((level) => (
                                                                <span key={level} className="rounded border border-border bg-[var(--bg-raised)] px-2.5 py-1 text-[11px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                                                    {level}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-y-1 text-[10px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                            <span className="text-muted-foreground">Grading</span>
                                                            <span className="font-medium">{type.grading}</span>
                                                            <span className="text-muted-foreground">Credits</span>
                                                            <span className="font-medium">{type.creditSystem}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-5 py-3">
                                <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                    <strong>institution_types</strong> table defines what types of higher education each country supports. Each type has its own level progression, grading scale, and credit system. A Nigerian Polytechnic student selects "Polytechnic" during registration and sees ND I/ND II/HND I/HND II {'\u2014'} not 100L/200L/300L.
                                </p>
                            </div>
                        </div>

                        {/* Multi-system institution callout */}
                        <div className="rounded-[var(--card-radius)] border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-5">
                            <h4 className="mb-2 text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                One School, Multiple Systems
                            </h4>
                            <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-content)' }}>
                                A private school in Lagos might offer both WAEC (NERDC curriculum) and Cambridge IGCSE. A school in Dubai might run IB, Cambridge, and CBSE. The schema supports this natively &mdash; an institution links to multiple education systems through an <strong className="text-foreground">institution_education_systems</strong> pivot table.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                                    <div className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>Lagos International Academy</div>
                                    <div className="text-[9px] text-muted-foreground">institution</div>
                                </div>
                                <span className="text-muted-foreground">{'\u2192'}</span>
                                <div className="flex gap-1.5">
                                    {[
                                        { name: 'NERDC', flag: '\uD83C\uDDF3\uD83C\uDDEC' },
                                        { name: 'Cambridge', flag: '\uD83C\uDF0D' },
                                    ].map((sys) => (
                                        <div key={sys.name} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5">
                                            <span className="text-sm">{sys.flag}</span>
                                            <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>{sys.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-muted-foreground">{'\u2192'}</span>
                                <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                                    <div className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>Student picks their system</div>
                                    <div className="text-[9px] text-muted-foreground">at enrollment</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Calendar System */}
                <div className="mx-auto max-w-[1200px] px-10 max-md:px-4">
                    <section className="border-b border-[var(--border-2)] py-14">
                        <div className="mb-8">
                            <div
                                className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                <span className="size-1.5 rounded-full bg-primary" />
                                Composable Primitives
                            </div>
                            <h2 className="text-[28px] font-bold tracking-tight max-md:text-[22px]" style={{ fontFamily: 'var(--font-display)' }}>
                                Calendar System
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                A headless <code className="rounded bg-muted px-1.5 py-0.5 text-xs">useCalendar</code> hook with composable grid, header, and cell primitives. One system powers exam timetables, review heatmaps, dashboard widgets, and more.
                            </p>
                        </div>

                        {/* Demo A: Full Calendar — Exam Period Timetable */}
                        <div className="mb-10">
                            <h3 className="mb-4 text-[16px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                Full Calendar — Exam Timetable Preview
                            </h3>
                            <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
                                <CalendarHeader
                                    monthLabel={fullCalendar.monthLabel}
                                    isCurrentMonthToday={fullCalendar.isCurrentMonthToday}
                                    onPrevMonth={fullCalendar.goToPrevMonth}
                                    onNextMonth={fullCalendar.goToNextMonth}
                                    onToday={fullCalendar.goToToday}
                                >
                                    {examPeriod.period ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 text-xs"
                                                onClick={() => setExamSetupOpen(true)}
                                            >
                                                <Pencil className="size-3" />
                                                Edit Period
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                                                onClick={() => examPeriod.setPeriod(null)}
                                            >
                                                <X className="size-3" />
                                                End Period
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => setExamSetupOpen(true)}
                                            className="gap-1.5 text-xs"
                                        >
                                            <ClipboardList className="size-3.5" />
                                            Set Exam Period
                                        </Button>
                                    )}
                                </CalendarHeader>
                                <CalendarGrid
                                    weeks={fullCalendar.weeks}
                                    weekDayLabels={fullCalendar.weekDayLabels}
                                    className="mt-3"
                                    onDateClick={(day) => {
                                        setCalendarSelectedDate(day.dateKey);
                                        if (examPeriod.isWithinPeriod(day.dateKey)) {
                                            setExamDayModalDate(day.dateKey);
                                            setExamDayModalOpen(true);
                                        }
                                    }}
                                    renderDay={(day) => {
                                        const dayEntries = examPeriod.entriesForDate(day.dateKey);
                                        const withinPeriod = examPeriod.isWithinPeriod(day.dateKey);
                                        const isStart = examPeriod.period?.startDate === day.dateKey;
                                        const isEnd = examPeriod.period?.endDate === day.dateKey;
                                        return (
                                            <ExamDayCell
                                                day={day}
                                                entries={dayEntries}
                                                isSelected={calendarSelectedDate === day.dateKey}
                                                inPeriod={withinPeriod}
                                                isPeriodStart={isStart}
                                                isPeriodEnd={isEnd}
                                            />
                                        );
                                    }}
                                />
                            </div>
                            {examPeriod.period && (
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-3 rounded-sm bg-destructive/10 ring-1 ring-destructive/20" />
                                        Exam period
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-destructive/70" />
                                        Scheduled exam
                                    </span>
                                    <span className="text-muted-foreground/60">
                                        {examPeriod.period.label} · {examPeriod.entries.length} exam{examPeriod.entries.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <ExamPeriodSetupModal
                            open={examSetupOpen}
                            onOpenChange={setExamSetupOpen}
                            initialPeriod={examPeriod.period}
                            onSave={(period) => {
                                examPeriod.setPeriod(period);
                                setExamSetupOpen(false);
                            }}
                        />

                        <ExamDayModal
                            open={examDayModalOpen}
                            onOpenChange={setExamDayModalOpen}
                            dateKey={examDayModalDate}
                            entries={examPeriod.entriesForDate(examDayModalDate)}
                            onAddEntry={examPeriod.addEntry}
                            onRemoveEntry={examPeriod.removeEntry}
                            courses={MOCK_COURSES}
                        />

                        {/* Demo B: Mini Calendar */}
                        <div className="mb-10">
                            <h3 className="mb-4 text-[16px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                Mini Calendar — Dashboard Widget
                            </h3>
                            <div className="flex flex-col items-start gap-6 md:flex-row">
                                <CalendarMini
                                    selectedDate={miniSelectedDate}
                                    onDateSelect={setMiniSelectedDate}
                                    eventDates={MINI_EVENT_DATES}
                                    className="w-full max-w-xs"
                                />
                                <div className="flex-1 rounded-[var(--card-radius)] border border-border bg-card p-5">
                                    <p className="text-xs font-semibold text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        Selected date
                                    </p>
                                    <p className="mt-1 text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                                        {miniSelectedDate
                                            ? miniSelectedDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                            : 'Click a date in the mini calendar'}
                                    </p>
                                    {miniSelectedDate && (() => {
                                        const key = `${miniSelectedDate.getFullYear()}-${String(miniSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(miniSelectedDate.getDate()).padStart(2, '0')}`;
                                        const dayExams = examPeriod.entriesForDate(key);
                                        if (dayExams.length === 0) return <p className="mt-2 text-xs text-muted-foreground">No exams scheduled.</p>;
                                        return (
                                            <div className="mt-3 space-y-2">
                                                {dayExams.map((e) => (
                                                    <div key={e.id} className="flex items-center gap-2 text-sm">
                                                        <span className="size-2 shrink-0 rounded-full bg-destructive/70" />
                                                        <span className="font-medium">{e.courseCode}</span>
                                                        <span className="text-muted-foreground">{e.courseName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Demo C: Composability */}
                        <div>
                            <h3 className="mb-4 text-[16px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                Composability — Synced Dual Grids
                            </h3>
                            <p className="mb-4 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Same <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">useCalendar</code> hook drives both grids. Navigation is synced, but each grid renders different content via its own <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">renderDay</code>.
                            </p>
                            <div className="mb-3">
                                <CalendarHeader
                                    monthLabel={syncedCalendar.monthLabel}
                                    isCurrentMonthToday={syncedCalendar.isCurrentMonthToday}
                                    onPrevMonth={syncedCalendar.goToPrevMonth}
                                    onNextMonth={syncedCalendar.goToNextMonth}
                                    onToday={syncedCalendar.goToToday}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[var(--card-radius)] border border-border bg-card p-4">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        Exam Dots
                                    </p>
                                    <CalendarGrid
                                        weeks={syncedCalendar.weeks}
                                        weekDayLabels={syncedCalendar.weekDayLabels}
                                        renderDay={(day) => {
                                            const dayEntries = examPeriod.entriesForDate(day.dateKey);
                                            return (
                                                <CalendarDayCell day={day} className="min-h-8 md:min-h-10">
                                                    {dayEntries.length > 0 && (
                                                        <div className="mt-0.5 flex gap-0.5">
                                                            {dayEntries.map((e) => (
                                                                <span
                                                                    key={e.id}
                                                                    className="size-1.5 rounded-full bg-destructive/70"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </CalendarDayCell>
                                            );
                                        }}
                                    />
                                </div>
                                <div className="rounded-[var(--card-radius)] border border-border bg-card p-4">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        Review Heatmap
                                    </p>
                                    <CalendarGrid
                                        weeks={syncedCalendar.weeks}
                                        weekDayLabels={syncedCalendar.weekDayLabels}
                                        renderDay={(day: CalendarDay) => {
                                            const count = REVIEW_HEATMAP.get(day.dateKey) ?? 0;
                                            return (
                                                <CalendarDayCell
                                                    day={day}
                                                    className={cn(
                                                        'min-h-8 md:min-h-10',
                                                        day.isCurrentMonth && count > 0 && count <= 3 && 'bg-emerald-100 dark:bg-emerald-950/50 reader:bg-emerald-950/50',
                                                        day.isCurrentMonth && count > 3 && count <= 7 && 'bg-emerald-200 dark:bg-emerald-900/60 reader:bg-emerald-900/60',
                                                        day.isCurrentMonth && count > 7 && 'bg-emerald-300 dark:bg-emerald-800/70 reader:bg-emerald-800/70',
                                                    )}
                                                >
                                                    {count > 0 && day.isCurrentMonth && (
                                                        <span className="mt-0.5 text-[9px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 reader:text-emerald-300">
                                                            {count}
                                                        </span>
                                                    )}
                                                </CalendarDayCell>
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="p-9 text-center" style={{ background: 'var(--bg-hero)' }}>
                    <div
                        className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        Skoolpad Architecture Redesign {'\u00B7'} Blocks + Curriculum + Questions + Global Model
                    </div>
                </footer>
            </div>
        </>
    );
}
