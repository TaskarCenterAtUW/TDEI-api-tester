# JMeter Performance Test

## Prerequisites
- [Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi) installed on your system.
- Ensure Java is installed and properly configured.

## Running the Test

1. Clone this repository or download the  `performance-test` folder.

2. Open a terminal and navigate to the directory where the `TDEI _Test_Plan.jmx` file is located.

3. Execute the JMeter test in non-GUI mode:

    ```bash
    jmeter -n -t TDEI _Test_Plan.jmx -l results.jtl
    ```

    - `-n`: Non-GUI mode
    - `-t`: Path to the JMX file (test plan)
    - `-l`: Path to save the test results (output file)

4. To view the results:

   You can view the results using JMeter GUI or generate a report:

    ```bash
    jmeter -g results.jtl -o /path/to/output/report
    ```

5. Open the generated report in your browser:

    ```bash
    open /path/to/output/report/index.html
    ```

## Notes

- Customize the `TDEI _Test_Plan.jmx` file as needed before running.
- Ensure that all required dependencies and test data are available for the test plan.
- Use JMeter desktop application for easy modification. Navigate to bin folder of jmeter and run `./jmeter`