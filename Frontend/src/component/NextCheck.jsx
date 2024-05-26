import React, { useContext, useEffect, useState } from 'react';
import moment from 'moment';
import { UserContext } from '../context/UserContext';
import api from '../api';
import '../styles/NextCheck.css'

export const NextCheck = () => {
  const { recentPay, incomeId, setIncomeData, incomeData, expenseData } = useContext(UserContext);
  const [currentDate, setCurrentDate] = useState(moment().format('MM-DD-YYYY'));
  const [nextPayDate, setNextPayDate] = useState('');
  const [expensesDue, setExpensesDue] = useState([]);

  useEffect(() => {
    console.log("Expense Data:", expenseData);
    console.log("Income Data:", incomeData);
    console.log("Recent Pay Date:", recentPay);

    if (recentPay) {
      const nextPay = moment(recentPay, 'YYYY-MM-DD').add(14, 'days'); // assuming bi-weekly pay cycle
      setNextPayDate(nextPay.format('YYYY-MM-DD'));
      console.log('Next Pay Date:', nextPay.format('YYYY-MM-DD'));

      const startOfNextPeriod = moment(recentPay, 'YYYY-MM-DD').add(1, 'days'); // Day after recent pay date
      const endOfNextPeriod = moment(recentPay, 'YYYY-MM-DD').add(15, 'days'); // 14 days after recent pay date
      console.log('Start of Next Period:', startOfNextPeriod.format('YYYY-MM-DD'));
      console.log('End of Next Period:', endOfNextPeriod.format('YYYY-MM-DD'));

      const dueExpenses = expenseData.filter(expense => {
        // Convert due_date integer to a date for the current month
        const currentMonth = moment().month();
        const expenseDueDate = moment().date(expense.due_date).month(currentMonth);
        
        // Adjust if the due date is in the next month
        if (expense.due_date < startOfNextPeriod.date()) {
          expenseDueDate.add(1, 'months');
        }

        console.log('Expense Due Date:', expenseDueDate.format('YYYY-MM-DD'));
        return expenseDueDate.isBetween(startOfNextPeriod, endOfNextPeriod, null, '[]');
      });

      console.log('Due Expenses:', dueExpenses);
      setExpensesDue(dueExpenses);
    }
  }, [expenseData, incomeData, recentPay]);

  useEffect(() => {
    const updateDate = () => setCurrentDate(moment().format('MM-DD-YYYY'));

    const now = moment();
    const midnight = moment().endOf('day').add(1, 'second');
    const msToMidnight = midnight.diff(now);

    const intervalId = setInterval(updateDate, 86400000);
    const timeoutId = setTimeout(updateDate, msToMidnight);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const updateIncomeData = async () => {
      if (nextPayDate && moment().isAfter(moment(nextPayDate, 'YYYY-MM-DD'))) {
        setCurrentDate(moment().format('MM-DD-YYYY')); // This might be redundant
        try {
          const response = await api.put(`/income/${incomeId}`, {
            recent_pay: nextPayDate
          });
          if (response.status === 200) {
            setIncomeData(response.data);
          } else {
            throw new Error('Failed to update income data');
          }
        } catch (error) {
          console.error('Error updating income data:', error);
        }
      }
      console.log('Income Data Updated:', incomeData);
    };

    updateIncomeData();
  }, [nextPayDate, incomeId, setIncomeData]);

 const totalDueExpenses = expensesDue.reduce((sum, expense) => sum + expense.amount, 0);
 console.log('Total Due Expenses:', totalDueExpenses);


    return (
      <div className='card'>
        <div className='card-content'>
          <div className='content'>
            <p className='has-text-weight-bold'>
              Next Check: {nextPayDate ? moment(nextPayDate, 'YYYY-MM-DD').format('MMM Do') : 'Calculating...'} for ${totalDueExpenses}
            </p>
            <div>
              <ul className='expenses-list'>
                {expensesDue.map(expense => (
                  <li key={expense.id} className='expense-item'>
                    {expense.name}: ${expense.amount} on the {moment(expense.due_date, 'DD').format('Do')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
};

export default NextCheck;
