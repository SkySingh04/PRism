import jsPDF from 'jspdf';
import { PRData, Comment, FileChange, CodeChange, LinkedIssue } from './types.js';
import fs from 'fs';
import path from 'path';

/**
 * Generates a PDF document containing all PR information
 * @param prData The complete PR data
 * @returns Buffer containing the PDF document
 */
export async function generatePrPdf(prData: PRData): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF();
  let y = 10; // Initial y position
  
  // Add PR title
  doc.setFontSize(18);
  doc.text(`PR #${prData.metadata.title}`, 10, y);
  y += 10;
  
  // Add PR metadata
  doc.setFontSize(12);
  doc.text(`Author: ${prData.metadata.author}`, 10, y);
  y += 7;
  doc.text(`Created: ${new Date(prData.metadata.created_at).toLocaleString()}`, 10, y);
  y += 7;
  doc.text(`Status: ${prData.metadata.state} ${prData.metadata.draft ? '(Draft)' : ''}`, 10, y);
  y += 7;
  doc.text(`Changes: ${prData.metadata.changed_files} files, +${prData.metadata.additions} -${prData.metadata.deletions}`, 10, y);
  y += 14;
  
  // Add PR description if present
  if (prData.metadata.body) {
    doc.setFontSize(14);
    doc.text('Description:', 10, y);
    y += 7;
    doc.setFontSize(10);
    
    // Handle multiline description
    const descriptionLines = prData.metadata.body.split('\n');
    for (const line of descriptionLines) {
      // Check if we need a new page
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      
      const wrappedText = doc.splitTextToSize(line, 180);
      doc.text(wrappedText, 10, y);
      y += wrappedText.length * 5;
    }
    y += 10;
  }
  
  // Add code changes section
  doc.setFontSize(14);
  doc.text('Code Changes:', 10, y);
  y += 10;
  
  // List changed files
  doc.setFontSize(12);
  for (const file of prData.files) {
    // Check if we need a new page
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
    
    doc.text(`${file.filename} (${file.status}): +${file.additions} -${file.deletions}`, 10, y);
    y += 7;
  }
  y += 10;
  
  // Add comments section
  doc.addPage();
  y = 10;
  doc.setFontSize(14);
  doc.text('PR Comments:', 10, y);
  y += 10;
  
  // List issue comments
  if (prData.comments.issue_comments.length > 0) {
    doc.setFontSize(12);
    doc.text('Issue Comments:', 10, y);
    y += 7;
    
    for (const comment of prData.comments.issue_comments) {
      // Check if we need a new page
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      
      doc.setFontSize(10);
      doc.text(`${comment.user} (${new Date(comment.created_at).toLocaleString()}):`, 10, y);
      y += 5;
      
      const commentLines = doc.splitTextToSize(comment.body, 180);
      doc.text(commentLines, 15, y);
      y += commentLines.length * 5 + 5;
    }
  } else {
    doc.setFontSize(10);
    doc.text('No issue comments', 10, y);
    y += 7;
  }
  
  // List review comments
  y += 10;
  doc.setFontSize(12);
  doc.text('Review Comments:', 10, y);
  y += 7;
  
  if (prData.comments.review_comments.length > 0) {
    for (const comment of prData.comments.review_comments) {
      // Check if we need a new page
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      
      doc.setFontSize(10);
      doc.text(`${comment.user} (${new Date(comment.created_at).toLocaleString()}):`, 10, y);
      y += 5;
      
      const commentLines = doc.splitTextToSize(comment.body, 180);
      doc.text(commentLines, 15, y);
      y += commentLines.length * 5 + 5;
    }
  } else {
    doc.setFontSize(10);
    doc.text('No review comments', 10, y);
    y += 7;
  }
  
  // Add linked issues section if present
  if (prData.linked_issues && prData.linked_issues.issues.length > 0) {
    doc.addPage();
    y = 10;
    doc.setFontSize(14);
    doc.text('Linked Issues:', 10, y);
    y += 10;
    
    for (const issue of prData.linked_issues.issues) {
      // Check if we need a new page
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      
      doc.setFontSize(12);
      doc.text(`Issue #${issue.number}: ${issue.title}`, 10, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(`Author: ${issue.author} | State: ${issue.state}`, 15, y);
      y += 5;
      
      if (issue.body) {
        const bodyLines = doc.splitTextToSize(issue.body, 175);
        doc.text(bodyLines, 15, y);
        y += bodyLines.length * 5 + 5;
      }
      
      // Add issue comments if present
      if (issue.comments.length > 0) {
        doc.text('Comments:', 15, y);
        y += 5;
        
        for (const comment of issue.comments) {
          // Check if we need a new page
          if (y > 280) {
            doc.addPage();
            y = 10;
          }
          
          doc.text(`${comment.author} (${new Date(comment.created_at).toLocaleString()}):`, 20, y);
          y += 5;
          
          const commentLines = doc.splitTextToSize(comment.body, 170);
          doc.text(commentLines, 25, y);
          y += commentLines.length * 5 + 5;
        }
      }
      
      y += 10;
    }
  }
  
  // Generate Buffer from PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

/**
 * Saves PR data as a PDF file with a specific filename format
 * @param prData The complete PR data
 * @param owner Repository owner
 * @param repo Repository name
 * @param prNumber Pull request number
 * @returns Filename of the saved PDF
 */
export async function savePrAsPdf(prData: PRData, owner: string, repo: string, prNumber: number): Promise<string> {
  const pdfBuffer = await generatePrPdf(prData);
  
  // Create artifacts directory if it doesn't exist
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${owner}-${repo}-pr-${prNumber}-${timestamp}.pdf`;
  const filePath = path.join(artifactsDir, filename);
  
  // Write PDF buffer to file
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
} 