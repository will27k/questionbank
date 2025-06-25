import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    marginBottom: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  questionContainer: {
    marginBottom: 15,
  },
  questionStem: {
    fontSize: 12,
    marginBottom: 5,
  },
  option: {
    fontSize: 11,
    marginLeft: 15,
    marginBottom: 3,
  },
  answerKeyContainer: {
    marginTop: 30,
  },
  answer: {
    fontSize: 12,
    marginBottom: 5,
  },
  reference: {
    fontSize: 10,
    fontFamily: 'Helvetica-Oblique',
    color: 'grey',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

interface Question {
  stem: string;
  type: string;
  options?: string[];
  answer: string;
  ref: string;
}

interface QuestionPdfDocumentProps {
  questions: Question[];
  title: string;
}

export default function QuestionPdfDocument({ questions, title }: QuestionPdfDocumentProps) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.heading}>{title}</Text>
        
        <View style={styles.section}>
          <Text style={styles.subheading}>Questions</Text>
          {questions.map((q, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.questionStem}>{`${index + 1}. ${q.stem}`}</Text>
              {q.type === 'mcq' && q.options && q.options.map((opt, i) => (
                <Text key={i} style={styles.option}>{`${String.fromCharCode(65 + i)}. ${opt}`}</Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.answerKeyContainer}>
          <Text style={styles.subheading}>Answer Key</Text>
          {questions.map((q, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.answer}>
                {`${index + 1}. ${q.answer}`}
              </Text>
               <Text style={styles.reference}>
                (Reference: {q.ref})
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
} 