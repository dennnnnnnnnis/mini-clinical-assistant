# Research Notes: Medical Coding & Documentation

This document lists the public sources used to understand ICD-10, CPT, and E&M coding basics for implementing the Clinical Assistant application.

## ICD-10 (International Classification of Diseases, 10th Revision)

### Primary Sources
- **WHO ICD-10 Online Browser** - https://icd.who.int/browse10/2019/en
  - Official WHO classification system for medical diagnoses
  - Used for understanding code structure and categories

- **CMS ICD-10-CM Official Guidelines** - https://www.cms.gov/medicare/icd-10/2023-icd-10-cm
  - Official US coding guidelines from Centers for Medicare & Medicaid Services
  - Provides coding rules and examples for proper code assignment

- **AAPC ICD-10 Resources** - https://www.aapc.com/icd-10/
  - Professional coding association resources
  - Code lookup examples and common coding scenarios

### Key Takeaways
- ICD-10 codes are alphanumeric (e.g., I10 for hypertension)
- Codes become more specific with additional characters
- Common categories: I (Circulatory), E (Endocrine), J (Respiratory), Z (Encounters)

## CPT (Current Procedural Terminology)

### Primary Sources
- **AMA CPT Database** - https://www.ama-assn.org/practice-management/cpt
  - Official CPT codes maintained by American Medical Association
  - Used for understanding procedure and service codes

- **CMS Physician Fee Schedule** - https://www.cms.gov/medicare/physician-fee-schedule
  - Medicare fee schedule with CPT code descriptions
  - Provides context for common office procedures

- **AAPC CPT Code Lookup** - https://www.aapc.com/codes/cpt-codes/
  - Professional resource for CPT code research
  - Examples of proper code usage and documentation requirements

### Key Takeaways
- CPT codes are 5-digit numeric codes (e.g., 99213 for office visit)
- Categories: 99XXX (E&M), 9XXXX (radiology/pathology), others (procedures)
- Level of service determined by complexity and time

## E&M (Evaluation and Management) Coding

### Primary Sources
- **CMS E&M Guidelines 2021** - https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/downloads/eval-mgmt-serv-guide-ice.pdf
  - Official guidelines for E&M coding
  - Documentation requirements and level determination

- **AMA E&M Documentation Guidelines** - https://www.ama-assn.org/system/files/2019-06/cpt-office-prolonged-svs-code-changes.pdf
  - Professional standards for E&M services
  - Time-based vs. medical decision making criteria

- **Family Practice Management E&M Guide** - https://www.aafp.org/fpm/2019/0900/p6.html
  - Practical examples of E&M level determination
  - Real-world coding scenarios and documentation

### Key Takeaways
- E&M levels range from 99211-99215 for established patients
- 2021+ guidelines emphasize medical decision making or time
- Documentation must support the level of service billed

## Medical Documentation Standards

### Primary Sources
- **Joint Commission Documentation Standards** - https://www.jointcommission.org/standards/standard-faqs/record-of-care/
  - Hospital accreditation standards for medical records
  - Quality and safety requirements for clinical documentation

- **AHIMA Documentation Guidelines** - https://ahima.org/resources/clinical-documentation-improvement/
  - Health Information Management Association best practices
  - Guidelines for accurate and complete medical records

- **CMS Documentation Requirements** - https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/downloads/improper-medicare-ffs-payments-factsheet.pdf
  - Federal requirements for medical documentation
  - Compliance and audit preparation guidelines

### Key Takeaways
- SOAP format: Subjective, Objective, Assessment, Plan
- Documentation must be timely, accurate, and complete
- Medical necessity must be clearly established

## SOAP Note Standards

### Primary Sources
- **AHRQ SOAP Note Guidelines** - https://www.ahrq.gov/patient-safety/settings/ambulatory/improvement/documentation.html
  - Agency for Healthcare Research and Quality standards
  - Best practices for ambulatory care documentation

- **Medical School Documentation Resources** - Various medical education institutions
  - Standard format and content expectations
  - Teaching examples of proper SOAP note structure

### Key Takeaways
- Subjective: Patient's reported symptoms and history
- Objective: Physical exam findings and test results
- Assessment: Clinical judgment and diagnoses
- Plan: Treatment plan and follow-up instructions

## Safety and Compliance

### Primary Sources
- **FDA Medical Device Guidelines** - https://www.fda.gov/medical-devices/
  - Regulations for medical software and devices
  - Requirements for clinical decision support tools

- **HIPAA Compliance Guidelines** - https://www.hhs.gov/hipaa/for-professionals/security/
  - Privacy and security requirements for medical data
  - Technical safeguards for electronic health information

- **Joint Commission Patient Safety Goals** - https://www.jointcommission.org/standards/national-patient-safety-goals/
  - Safety requirements for healthcare organizations
  - Risk management and error prevention strategies

### Key Takeaways
- Medical software must include appropriate disclaimers
- Clinical review is required for all AI-generated content
- Emergency conditions require immediate medical attention flags

## Implementation Notes

### Code Selection Strategy
1. Used most common ICD-10 codes from primary care settings
2. Selected representative CPT codes for office visits and common procedures
3. Included preventive care codes (Z-codes) for wellness visits

### Safety Implementation
1. Emergency keyword detection based on triage protocols
2. Disclaimer language following FDA guidance for clinical decision support
3. Confidence scoring to indicate AI uncertainty levels

### Quality Assurance
1. Cross-referenced codes with official databases
2. Validated common coding scenarios against professional resources
3. Implemented guardrails based on medical documentation standards

---

**Note**: This research was conducted using publicly available resources and professional medical coding standards. All implementation follows established healthcare documentation practices and includes appropriate safety disclaimers.