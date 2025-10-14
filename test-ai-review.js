// Use native fetch for Node.js 18+

// Test the AI review endpoint with sample experience data
const testExperienceData = [
  {
    position: "Sales Representative",
    company: "ABC Company", 
    duration: "2022 - Present",
    description_items: [
      "Managed client relationships",
      "Improved sales for the team",
      "Responsible for meeting quotas",
      "Worked with customers to solve problems"
    ]
  },
  {
    position: "Marketing Intern",
    company: "XYZ Corp",
    duration: "2021 - 2022", 
    description_items: [
      "Helped with marketing campaigns",
      "Did various marketing tasks",
      "Assisted the marketing team"
    ]
  }
];

async function testAIReview() {
  console.log('🧪 Testing AI Review Endpoint...');
  
  try {
    const response = await fetch('http://localhost:3002/api/cv/review-experience', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        experienceData: testExperienceData,
        jobTitle: 'Sales Manager'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ API Response Success!');
    console.log('🔍 Review Summary:', result.review?.summary);
    console.log('📊 Overall Score:', result.review?.overallScore + '/10');
    console.log('🚨 Issues Found:', result.review?.improvements?.length || 0);
    
    if (result.review?.improvements?.length > 0) {
      console.log('\n📝 Sample Improvement:');
      const firstImprovement = result.review.improvements[0];
      console.log('   Original:', firstImprovement.originalText);
      console.log('   Issue:', firstImprovement.issue);
      console.log('   Improved:', firstImprovement.improvedText);
      console.log('   Severity:', firstImprovement.severity);
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testAIReview();