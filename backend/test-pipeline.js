/**
 * Test script for AI Content Generation Pipeline
 * 
 * This script demonstrates how to use the content generation pipeline
 * Run with: node test-pipeline.js
 */

const { PrismaClient } = require('./generated/prisma');
const {
  runContentGenerationPipeline,
  runPipelineForAllUserSubjects,
  checkGenerationStatus,
} = require('./services/content-pipeline');

const prisma = new PrismaClient();

async function testPipeline() {
  try {
    console.log('=== AI Content Generation Pipeline Test ===\n');

    // Example 1: Check if a user exists
    console.log('1. Checking for test user...');
    const users = await prisma.users.findMany({
      take: 1,
      where: {
        grade_level: { not: null },
        board: { not: null },
      },
    });

    if (users.length === 0) {
      console.log('No users found with grade_level and board set.');
      console.log('Please create a user first with:');
      console.log('  - grade_level (e.g., "8")');
      console.log('  - board (e.g., "CBSE")');
      console.log('  - subjects array (e.g., ["science", "math"])');
      return;
    }

    const testUser = users[0];
    console.log(`Found user: ${testUser.name} (ID: ${testUser.user_id})`);
    console.log(`  Grade: ${testUser.grade_level}`);
    console.log(`  Board: ${testUser.board}`);
    console.log(`  Subjects: ${testUser.subjects?.join(', ') || 'None'}\n`);

    if (!testUser.subjects || testUser.subjects.length === 0) {
      console.log('User has no subjects assigned. Please add subjects first.');
      return;
    }

    // Example 2: Find a subject
    const subjectCode = testUser.subjects[0];
    const subject = await prisma.subjects.findUnique({
      where: { code: subjectCode },
    });

    if (!subject) {
      console.log(`Subject with code "${subjectCode}" not found in database.`);
      console.log('Please ensure subjects table has matching records.');
      return;
    }

    console.log(`2. Testing with subject: ${subject.name} (ID: ${subject.id})\n`);

    // Example 3: Check current status
    console.log('3. Checking generation status...');
    const status = await checkGenerationStatus(
      testUser.user_id,
      subject.id,
      testUser.grade_level,
      testUser.board
    );

    if (status) {
      console.log(`Status: ${status.status}`);
      console.log(`Chapters generated: ${status.chapters_generated}`);
      console.log(`Topics generated: ${status.topics_generated}`);
      
      if (status.status === 'completed') {
        console.log('\n✓ Content already generated for this combination.');
        console.log('Use the reset endpoint to regenerate if needed.\n');
        
        // Show generated content
        const chapters = await prisma.chapters.findMany({
          where: {
            user_id: testUser.user_id,
            subject_id: subject.id,
          },
          include: {
            topics: true,
          },
        });

        console.log(`\nGenerated Content Summary:`);
        console.log(`Total Chapters: ${chapters.length}`);
        chapters.forEach((chapter, idx) => {
          console.log(`  ${idx + 1}. ${chapter.title} (${chapter.topics.length} topics)`);
        });
        
        return;
      }
    } else {
      console.log('No generation status found. Ready to generate.\n');
    }

    // Example 4: Run pipeline for single subject
    console.log('4. Starting content generation pipeline...');
    console.log('This may take 1-3 minutes depending on content size.\n');

    const result = await runContentGenerationPipeline(
      testUser.user_id,
      subject.id
    );

    console.log('\n✓ Pipeline completed successfully!');
    console.log(`Chapters created: ${result.chaptersCount}`);

    // Example 5: Verify generated content
    console.log('\n5. Verifying generated content...');
    const chapters = await prisma.chapters.findMany({
      where: {
        user_id: testUser.user_id,
        subject_id: subject.id,
      },
      include: {
        topics: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log(`\nGenerated ${chapters.length} chapters:\n`);
    chapters.forEach((chapter, idx) => {
      console.log(`${idx + 1}. ${chapter.title}`);
      console.log(`   Topics: ${chapter.topics.length}`);
      chapter.topics.slice(0, 3).forEach((topic, tidx) => {
        console.log(`     ${tidx + 1}. ${topic.title}`);
      });
      if (chapter.topics.length > 3) {
        console.log(`     ... and ${chapter.topics.length - 3} more`);
      }
      console.log('');
    });

    console.log('\n=== Test Complete ===\n');

    // Uncomment to test generating all subjects:
    // console.log('\n6. Testing generation for all subjects...');
    // const allResults = await runPipelineForAllUserSubjects(testUser.user_id);
    // console.log('Results:', allResults);

  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPipeline();
